import * as React from "react";
import { effect, reactive, isReactive } from "@vue/reactivity";
import { isEqual } from "ohash";

export function Apex<D, P>(data: D, renderer) {
  const apexThis = this;
  apexThis.destroyHandlers = [];
  apexThis.mountHandlers = [];

  class EffectRenderer extends React.Component {
    tree: null | React.ReactNode;
    $data: D;

    constructor(props) {
      super(props);
      this.tree = null;
      this.makeDataReactive();
    }

    componentDidMount() {
      this.run();
    }

    componentDidUpdate(prevProps: Readonly<{}>): void {
      if (isEqual(prevProps, this.props)) {
        return;
      }
      // re-create tree if props have changed
      this._createTree();
    }

    async componentWillUnmount() {
      for (let destroyer of apexThis.destroyHandlers) {
        await destroyer();
      }
      this.tree = null;
    }

    makeDataReactive() {
      this.$data = isReactive(data) ? data : <D>reactive(data);
    }

    async run() {
      for (let mounter of apexThis.mountHandlers) {
        mounter({
          data: this.$data,
          props: this.props,
        });
      }

      effect(() => {
        this._createTree();
      });
    }

    _createTree() {
      const render = renderer;
      const self = this;
      self.tree = render({
        data: self.$data,
        props: self.props,
      });
      this.forceUpdate();
    }

    render() {
      return this.tree;
    }
  }

  // @ts-expect-error dynamically created function
  EffectRenderer.onMount = function onMount(d) {
    apexThis.mountHandlers.push(d);
    return this;
  };

  // @ts-expect-error dynamically created function
  EffectRenderer.onDestroy = function onDestroy(d) {
    apexThis.destroyHandlers.push(d);
    return this;
  };

  return EffectRenderer;
}
