import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import {
  HistoryExtensions,
  HistoryPlugin,
  Presets as HistoryPresets
} from "rete-history-plugin";

type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = ReactArea2D<Schemes>;

class Node extends ClassicPreset.Node {
  constructor(label: string, socket: ClassicPreset.Socket) {
    super(label);

    this.addInput("port", new ClassicPreset.Input(socket));
    this.addOutput("port", new ClassicPreset.Output(socket));
  }
}

class Connection<
  A extends Node,
  B extends Node
> extends ClassicPreset.Connection<A, B> {}

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");

  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  const history = new HistoryPlugin<Schemes>();

  HistoryExtensions.keyboard(history);

  history.addPreset(HistoryPresets.classic.setup());

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });

  render.addPreset(Presets.classic.setup());

  connection.addPreset(ConnectionPresets.classic.setup());

  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(history);

  AreaExtensions.simpleNodesOrder(area);

  const a = new Node("A", socket);
  const b = new Node("B", socket);

  await editor.addNode(a);
  await editor.addNode(b);

  await editor.addConnection(
    new ClassicPreset.Connection(a, "port", b, "port")
  );

  await area.translate(b.id, { x: 300, y: 0 });

  AreaExtensions.zoomAt(area, editor.getNodes());

  area.addPipe(async (context) => {
    if (context.type === "contextmenu") {
      const source = context.data.context;
      const event = context.data.event;
      event.preventDefault();
      event.stopPropagation();

      if (source === "root") {
        const node = new Node("!!", socket);
        await editor.addNode(node);
        area.area.setPointerFrom(event);

        await area.translate(node.id, area.area.pointer);
      } else if (source instanceof Node) {
        for (const c of editor
          .getConnections()
          .filter((c) => c.source === source.id || c.target === source.id)) {
          await editor.removeConnection(c.id);
        }
        await editor.removeNode(source.id);
      }
    }

    return context;
  });
  return {
    destroy: () => area.destroy()
  };
}
