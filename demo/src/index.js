import React, { Component } from "react";
import { render } from "react-dom";

import ReactContainerTree from "../../src";

class Demo extends Component {
  render() {
    return (
      <div>
        <ReactContainerTree width={1024} height={1024} fileName="data.json" />
      </div>
    );
  }
}

render(<Demo />, document.querySelector("#demo"));
