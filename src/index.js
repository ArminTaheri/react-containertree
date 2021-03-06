import React, { Component } from "react";
import * as d3 from "d3-3";
import $ from "jquery";

function changed() {
  timeout = clearTimeout(timeout);
  (this.value === "tree" ? tree : cluster)(root);
  const t = d3.transition().duration(750);
  node.transition(t).attr("transform", function(d) {
    return "translate(" + d.y + "," + d.x + ")";
  });
  link.transition(t).attr("d", diagonal);
}

function diagonal(d) {
  return (
    "M" +
    d.y +
    "," +
    d.x +
    "C" +
    (d.parent.y + 100) +
    "," +
    d.x +
    " " +
    (d.parent.y + 100) +
    "," +
    d.parent.x +
    " " +
    d.parent.y +
    "," +
    d.parent.x
  );
}
export default class extends Component {
  componentWillReceiveProps(nextProps) {
    this.renderPlot(nextProps.fileName, nextProps);
  }
  componentDidMount() {
    this.renderPlot(this.props.fileName, this.props);
  }
  renderPlot(fileName, props) {
    if (!this.svg) {
      return;
    }
    if (this.g) {
      this.g.remove();
      this.g = null;
    }
    var margin = {
        top: 20,
        right: 120,
        bottom: 20,
        left: 120
      },
      width = props.width - margin.right - margin.left,
      height = props.height - margin.top - margin.bottom;

    var i = 0,
      duration = 750,
      root;

    var tree = d3.layout.tree().size([height, width]);

    var diagonal = d3.svg.diagonal().projection(function(d) {
      return [d.y, d.x];
    });

    var svg = this.svg
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom);
    this.g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const g = this.g;

    var files = {};
    d3.json("data.json", function(error, root) {
      if (error) throw error;

      root.x0 = height / 2;
      root.y0 = 0;

      function collapse(d) {
        if (d.children) {
          files[d.key] = [];
          $.each(d.children, function(i, child) {
            files[d.key].push(child.name);
          });
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }

      root.children.forEach(collapse);
      update(root);

      files["/"] = [];

      $.each(root.children, function(i, child) {
        $("#filelist").append(
          '<div class="alert alert-info filealert">' + child.name + "</div>"
        );
        files["/"].push(child.name);
      });

      d3.select(self.frameElement).style("height", "800px");

      function update(source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
          d.y = d.depth * 180;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node").data(nodes, function(d) {
          return d.id || (d.id = ++i);
        });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node
          .enter()
          .append("g")
          .attr("class", "node")
          .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
          })
          .on("click", click)
          .on("mouseover", showFiles);

        nodeEnter
          .append("image")
          .attr("x", "-8px")
          .attr("y", "-8px")
          .attr("width", "24px")
          .attr("height", "24px")
          .attr("xlink:href", function(d) {
            if (d._children != null) {
              if (d._children.length > 0) {
                return "https://github.com/vsoch/singularity-python/raw/v2.5/singularity/views/static/img/folder-blue.png";
              } else {
                return "https://github.com/vsoch/singularity-python/raw/v2.5/singularity/views/static/img/folder.png";
              }
            }
          });

        nodeEnter
          .append("circle")
          .attr("r", 1e-6)
          .style("fill", function(d) {
            return d._children ? "transparent" : "lightsteelblue";
          });

        nodeEnter
          .append("text")
          .attr("x", function(d) {
            return d.children || d._children ? -10 : 10;
          })
          .attr("dy", ".35em")
          .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
          })
          .text(function(d) {
            return d.name;
          })
          .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node
          .transition()
          .duration(duration)
          .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
          });

        nodeUpdate
          .select("circle")
          .attr("r", 4.5)
          .style("fill", function(d) {
            return d._children ? "transparent" : "lightsteelblue";
          });

        nodeUpdate.select("text").style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node
          .exit()
          .transition()
          .duration(duration)
          .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
          })
          .remove();

        nodeExit.select("circle").attr("r", 1e-6);

        nodeExit.select("text").style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link").data(links, function(d) {
          return d.target.id;
        });

        // Enter any new links at the parent's previous position.
        link
          .enter()
          .insert("path", "g")
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("style", function(d) {
            if (d.target.id == 1) {
              return "stroke:#ccc";
            }
            if (d.target.labels == "added") {
              return "stroke:#469e30";
            }
            if (d.target.labels == "removed") {
              return "stroke:#9e4a52";
            }
          })
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {
              x: source.x0,
              y: source.y0
            };
            return diagonal({
              source: o,
              target: o
            });
          });

        // Transition links to their new position.
        link
          .transition()
          .duration(duration)
          .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link
          .exit()
          .transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {
              x: source.x,
              y: source.y
            };
            return diagonal({
              source: o,
              target: o
            });
          })
          .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
          d.x0 = d.x;
          d.y0 = d.y;
        });
      }

      // Toggle children on click.
      function click(d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      }

      // Show files on mouseover
      function showFiles(d) {
        var fileList = files[d.key];
        $("#filelist").text("");
        if (fileList != null) {
          $.each(fileList, function(e, i) {
            $("#filelist").append(
              '<div class="alert alert-info filealert">' + i + "</div>"
            );
          });
        } else {
          $("#filelist").append(
            '<div class="alert alert-warning filealert">NO FILES</div>'
          );
        }
      }
    });
  }
  render() {
    const { width, height } = this.props;
    return (
      <svg
        width={width}
        height={height}
        ref={svg => {
          this.svg = d3.select(svg);
        }}
      />
    );
  }
}
