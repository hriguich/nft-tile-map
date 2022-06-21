import * as React from "react";

import { debounce } from "../../lib/debounce";
import { panzoom } from "../../lib/panzoom";
import { getViewport } from "../../lib/viewport";
import { Coord } from "../../lib/common";
import { renderMap } from "../../render/map";
import { Props, State } from "./TileMap.types";

const MOBILE_WIDTH = 768;

export class TileMap extends React.PureComponent<Props, State> {
  static defaultProps = {
    x: 0,
    y: 0,
    className: "",
    initialX: 0,
    initialY: 0,
    size: 18,
    width: 640,
    height: 480,
    zoom: 1,
    minSize: 7,
    maxSize: 40,
    minX: -150,
    maxX: 150,
    minY: -150,
    maxY: 150,
    panX: 0,
    panY: 0,
    padding: 4,
    isDraggable: true,
    renderMap: renderMap,
  };

  private oldState: State;
  private canvas: HTMLCanvasElement | null;
  private mounted: boolean;
  private hover: Coord | null;
  private popupTimeout: number | null;
  private mousedownTimestamp?: number;
  private destroy?: () => void;
  private loop?: () => void;

  debouncedRenderMap = debounce(this.renderMap.bind(this), 400);
  debouncedUpdateCenter = debounce(this.updateCenter.bind(this), 100);
  debouncedHandleChange = debounce(this.handleChange.bind(this), 50);

  constructor(props: Props) {
    super(props);

    const { x, y, initialX, initialY, size, zoom, panX, panY } = props;
    const initialState = {
      pan: { x: panX, y: panY },
      center: {
        x: x == null ? initialX : x,
        y: y == null ? initialY : y,
      },
      size: zoom * size,
      zoom,
      popup: null,
      image: null,
    };
    this.state = this.generateState(props, initialState);
    this.oldState = this.state;
    this.hover = null;
    this.mounted = false;
    this.canvas = null;
    this.popupTimeout = null;
    this.loop = () => {
      window.requestAnimationFrame(this.loop);
      this.renderMap();
    };
  }

  UNSAFE_componentWillUpdate(nextProps: Props, nextState: State) {
    const { x, y } = this.props;

    if (
      (x !== nextProps.x || y !== nextProps.y) &&
      (nextProps.x !== nextState.center.x || nextProps.y !== nextState.center.y)
    ) {
      nextState = {
        ...nextState,
        center: {
          x: nextProps.x,
          y: nextProps.y,
        },
        pan: {
          x: 0,
          y: 0,
        },
      };
    }

    const newState = this.generateState(nextProps, nextState);
    const isViewportDifferent =
      newState.width !== this.oldState.width ||
      newState.height !== this.oldState.height ||
      newState.nw.x !== this.oldState.nw.x ||
      newState.nw.y !== this.oldState.nw.y ||
      newState.se.x !== this.oldState.se.x ||
      newState.se.y !== this.oldState.se.y ||
      newState.zoom !== this.oldState.zoom;

    // The coords or the amount of parcels changed, so we need to update the state
    if (
      nextProps.x !== x ||
      nextProps.y !== y ||
      !this.oldState ||
      isViewportDifferent
    ) {
      this.oldState = newState;
      this.setState(newState);
      this.debouncedHandleChange();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const { zoom, maxSize, minSize, size } = nextProps;
    const maxZoom = maxSize / size;
    const minZoom = minSize / size;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom));

    if (newZoom !== this.props.zoom && newZoom !== this.state.zoom) {
      this.setState({
        zoom: newZoom,
        size: this.props.size * newZoom,
      });
    }
  }

  componentDidUpdate() {
    this.debouncedRenderMap();
    this.oldState = this.state;
  }

  componentDidMount() {
    const { isDraggable } = this.props;

    this.renderMap();

    if (this.canvas) {
      if (isDraggable) {
        this.destroy = panzoom(this.canvas, this.handlePanZoom);
      }
      this.canvas.addEventListener("click", this.handleClick);
      this.canvas.addEventListener("mousedown", this.handleMouseDown);
      this.canvas.addEventListener("mousemove", this.handleMouseMove);
      this.canvas.addEventListener("mouseout", this.handleMouseOut);
    }
    this.mounted = true;
  }

  componentWillUnmount() {
    if (this.destroy) {
      this.destroy();
    }
    if (this.canvas) {
      this.canvas.removeEventListener("click", this.handleClick);
      this.canvas.removeEventListener("mousedown", this.handleMouseDown);
      this.canvas.removeEventListener("mousemove", this.handleMouseMove);
      this.canvas.removeEventListener("mouseout", this.handleMouseOut);
    }
    this.mounted = false;
  }

  generateState(
    props: { width: number; height: number; padding: number },
    state: { pan: Coord; center: Coord; zoom: number; size: number }
  ): State {
    // const tile_sheet = new Image();

    // tile_sheet.src =
    //   "https://www.industrialempathy.com/img/remote/ZiClJf-640w.avif";
    const { width, height, padding } = props;
    const { pan, zoom, center, size } = state;
    const image = null;
    // console.log(image);
    const viewport = getViewport({
      width,
      height,
      center,
      pan,
      size,
      padding,
    });
    return { ...viewport, pan, zoom, center, size, image };
  }

  handleChange() {
    const { onChange } = this.props;
    const { nw, se, center, zoom } = this.state;
    if (this.mounted && onChange) {
      onChange({ nw, se, center, zoom });
    }
  }

  handlePanZoom = (args: { dx: number; dy: number; dz: number }) => {
    if (!this.props.isDraggable) return;
    const { dx, dy, dz } = args;
    const { size, maxSize, minSize, minX, maxX, minY, maxY, padding } =
      this.props;
    const { pan, zoom } = this.state;

    const maxZoom = maxSize / size;
    const minZoom = this.isMobile()
      ? (minSize / size) * 1.5
      : (minSize / size) * 1.2;

    const newPan = { x: pan.x - dx, y: pan.y - dy };
    const newZoom = Math.max(
      minZoom,
      Math.min(maxZoom, zoom - dz * this.getDzZoomModifier())
    );
    const newSize = newZoom * size;

    const halfWidth = (this.state.width - padding) / 2;
    const halfHeight = (this.state.height - padding) / 2;

    const boundaries = {
      nw: { x: minX - halfWidth, y: maxY + halfHeight },
      se: { x: maxX + halfWidth, y: minY - halfHeight },
    };

    const viewport = {
      nw: {
        x: this.state.center.x - halfWidth,
        y: this.state.center.y + halfHeight,
      },
      se: {
        x: this.state.center.x + halfWidth,
        y: this.state.center.y - halfHeight,
      },
    };

    if (viewport.nw.x + newPan.x / newSize < boundaries.nw.x) {
      newPan.x = (boundaries.nw.x - viewport.nw.x) * newSize;
    }
    if (viewport.nw.y - newPan.y / newSize > boundaries.nw.y) {
      newPan.y = (viewport.nw.y - boundaries.nw.y) * newSize;
    }
    if (viewport.se.x + newPan.x / newSize > boundaries.se.x) {
      newPan.x = (boundaries.se.x - viewport.se.x) * newSize;
    }
    if (viewport.se.y - newPan.y / newSize < boundaries.se.y) {
      newPan.y = (viewport.se.y - boundaries.se.y) * newSize;
    }

    this.setState({
      pan: newPan,
      zoom: newZoom,
      size: newSize,
    });
    // this.renderMap();
    this.debouncedUpdateCenter();
  };

  mouseToCoords(x: number, y: number) {
    const { padding } = this.props;
    const { size, pan, center, width, height } = this.state;

    const panOffset = { x: (x + pan.x) / size, y: (y + pan.y) / size };

    const viewportOffset = {
      x: (width - padding - 0.5) / 2 - center.x,
      y: (height - padding) / 2 + center.y,
    };

    const coordX = Math.round(panOffset.x - viewportOffset.x);
    const coordY = Math.round(viewportOffset.y - panOffset.y);

    return [coordX, coordY];
  }

  handleClick = (event) => {
    const [x, y] = this.mouseToCoords(event.layerX, event.layerY);
    if (!this.inBounds(x, y)) {
      return;
    }

    const { onClick, onMouseUp } = this.props;
    if (onClick) {
      const elapsed = Date.now() - this.mousedownTimestamp!;
      if (elapsed < 200) {
        const tileInfo = this.props.layers[0](x, y);
        if (tileInfo.type != 12) {
          const owner = tileInfo.owner;
          const type = tileInfo.type;
          const landId = tileInfo.landId;

          if (type === 1) {
            onClick([{ x, y }], tileInfo);
            this.renderMap();
          } else {
            let topSteps = 0;
            let isTop = true;
            while (isTop) {
              let topTileInfo = this.props.layers[0](x, y + topSteps);
              if (
                topTileInfo.owner === owner &&
                topTileInfo.landId === landId &&
                topTileInfo.type === type
              ) {
                topSteps = topSteps + 1;
              } else {
                topSteps = topSteps;
                isTop = false;
                break;
              }
            }

            let bottomSteps = 0;
            let isBottom = true;
            while (isBottom) {
              const bottomTileInfo = this.props.layers[0](x, y + bottomSteps);
              if (
                bottomTileInfo.owner === owner &&
                bottomTileInfo.type === type &&
                bottomTileInfo.landId === landId
              ) {
                bottomSteps = bottomSteps - 1;
              } else {
                bottomSteps = bottomSteps + 1;
                isBottom = false;
                break;
              }
            }

            let leftSteps = 0;
            let isLeft = true;
            while (isLeft) {
              const leftTileInfo = this.props.layers[0](x + leftSteps, y);
              if (
                leftTileInfo.owner === owner &&
                leftTileInfo.landId === landId &&
                leftTileInfo.type === type
              ) {
                leftSteps = leftSteps - 1;
              } else {
                leftSteps = leftSteps;
                isLeft = false;
                break;
              }
            }

            let rightSteps = 0;
            let isRight = true;
            while (isRight) {
              const rightTileInfo = this.props.layers[0](x + rightSteps, y);
              if (
                rightTileInfo.owner === owner &&
                rightTileInfo.landId === landId &&
                rightTileInfo.type === type
              ) {
                rightSteps = rightSteps + 1;
              } else {
                rightSteps = rightSteps - 1;
                isRight = false;
                break;
              }
            }
            const rightBottomCorner = { y: y + bottomSteps, x: x + rightSteps };
            const xCoordsCount = Array(rightSteps - leftSteps);
            const yCoordsCount = Array(topSteps - bottomSteps);
            let yTiles = [];
            let tiles = [];
            for (let i = 0; i < yCoordsCount.length; i++) {
              yTiles.push({
                x: rightBottomCorner.x,
                y: rightBottomCorner.y + i,
              });
            }
            for (let i = 0; i < yTiles.length; i++) {
              const tile = yTiles[i];
              for (let index = 0; index < xCoordsCount.length; index++) {
                tiles.push({ x: tile.x - index, y: tile.y });
              }
            }

            onClick(tiles, tileInfo);
            this.renderMap();
          }
        }
      }
    }
    if (onMouseUp) {
      onMouseUp(x, y);
      this.renderMap();
    }
  };

  handleMouseDown = (event) => {
    const { onMouseDown } = this.props;
    this.mousedownTimestamp = Date.now();
    if (onMouseDown) {
      const [x, y] = this.mouseToCoords(event.layerX, event.layerY);
      if (!this.inBounds(x, y)) {
        return;
      }
      onMouseDown(x, y);
      this.renderMap();
    }
  };

  handleMouseMove = (event) => {
    const { layerX, layerY } = event;
    const [x, y] = this.mouseToCoords(layerX, layerY);
    if (!this.inBounds(x, y)) {
      this.hidePopup();
      return;
    }

    if (!this.hover || this.hover.x !== x || this.hover.y !== y) {
      this.hover = { x, y };
      this.showPopup(x, y, layerY, layerX);
    }
  };

  handleMouseOut = () => {
    this.hidePopup();
  };

  inBounds(x: number, y: number) {
    const { minX, minY, maxX, maxY } = this.props;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  showPopup(x: number, y: number, top: number, left: number) {
    const { onPopup, onHover } = this.props;

    if (onPopup) {
      this.hidePopup();
      if (this.props.layers[0](x, y).type != 12) {
        this.popupTimeout = +setTimeout(() => {
          if (this.mounted) {
            this.setState(
              {
                popup: { x, y, top, left, visible: true },
              },
              () => onPopup(this.state.popup!)
            );
          }
        }, 100);
      }
    }

    if (onHover) {
      onHover(x, y);
      this.renderMap();
    }
  }

  hidePopup() {
    const { onPopup } = this.props;
    if (onPopup) {
      if (this.popupTimeout) {
        clearTimeout(this.popupTimeout);
      }

      if (this.state.popup) {
        this.setState(
          {
            popup: {
              ...this.state.popup,
              visible: false,
            },
          },
          () => {
            onPopup(this.state.popup!);
          }
        );
      }
    }
  }

  updateCenter() {
    const { pan, center, size } = this.state;

    const panX = pan.x % size;
    const panY = pan.y % size;
    const newPan = { x: panX, y: panY };
    const newCenter = {
      x: center.x + Math.floor((pan.x - panX) / size),
      y: center.y - Math.floor((pan.y - panY) / size),
    };

    this.setState({
      pan: newPan,
      center: newCenter,
    });
  }

  renderMap() {
    if (!this.canvas) {
      return;
    }

    const { width, height, layers, renderMap } = this.props;
    const { nw, se, pan, size, center } = this.state;
    const ctx = this.canvas.getContext("2d")!;
    renderMap({
      ctx,
      width,
      height,
      size,
      pan,
      nw,
      se,
      center,
      layers,
    });
  }

  refCanvas = (canvas: HTMLCanvasElement | null) => {
    this.canvas = canvas;
    this.loop();
  };

  handleTarget = () => {
    const { x, y } = this.props;
    this.setState({ center: { x, y } });
  };

  getDz() {
    const { zoom } = this.state;
    return Math.sqrt(zoom) * (this.isMobile() ? 100 : 50);
  }

  getDzZoomModifier() {
    return this.isMobile() ? 0.005 : 0.01;
  }

  isMobile() {
    return this.props.width < MOBILE_WIDTH;
  }

  getCanvasClassName() {
    const { isDraggable, onClick } = this.props;

    let classes = "react-tile-map-canvas";
    if (isDraggable) classes += " draggable";
    if (onClick) classes += " clickable";

    return classes;
  }

  render() {
    const { width, height, className } = this.props;

    const styles = { width, height };

    const classes = ("react-tile-map " + className).trim();
    return (
      <div>
        <meta name="viewport" content="width=device-width, user-scalable=no" />

        {this.state.popup?.visible && !this.isMobile() && (
          <div
            className="fixed z-[999] rounded-lg text-white bg-gray-900 px-5 py-2 "
            style={{
              top: this.state.popup?.top - 30,
              left: this.state.popup?.left + 30,
            }}
          >
            <div className="flex space-x-2 mb-2">
              <h2>Coords</h2>
              <p>x: {this.state.popup?.x}</p>
              <p>y: {this.state.popup?.y}</p>
            </div>
            <div className="flex space-x-6">
              <div className="flex text-xs flex-col">
                <div className="flex">
                  <h2>Land id </h2>
                  <p>
                    {` : `}
                    {
                      this.props.layers[0](
                        this.state.popup?.x,
                        this.state.popup?.y
                      )?.landId
                    }
                  </p>
                </div>
                <div className="flex">
                  <h2>Owner </h2>
                  <p>
                    {` : `}
                    {
                      this.props.layers[0](
                        this.state.popup?.x,
                        this.state.popup?.y
                      )?.owner
                    }
                    {/* )?.owner.substring(0, 6)} */}
                  </p>
                </div>

                <div className="flex mt-3">
                  <p>
                    {this.props.layers[0](
                      this.state.popup?.x,
                      this.state.popup?.y
                    ).isHighTraffic ? (
                      <p className="text-red-800 font-semibold text-sm">
                        High traffic Area
                      </p>
                    ) : (
                      <p className="text-green-800 font-semibold text-sm">
                        Low traffic area
                      </p>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex text-xs flex-col">
                <div className="flex ">
                  <h2>Square meters </h2>
                  <p>
                    {` : `}
                    {
                      this.props.SQUARE_BY_TYPE[
                        this.props.layers[0](
                          this.state.popup?.x,
                          this.state.popup?.y
                        ).type
                      ]
                    }
                  </p>
                </div>
                <div className="flex ">
                  <h2>Zone </h2>
                  <p>
                    {` : `}
                    {
                      this.props.layers[0](
                        this.state.popup?.x,
                        this.state.popup?.y
                      ).zone
                    }
                  </p>
                </div>
                <div className="flex">
                  <p>
                    {
                      this.props.layers[0](
                        this.state.popup?.x,
                        this.state.popup?.y
                      ).billboard
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={classes} style={styles}>
          <canvas
            className={this.getCanvasClassName()}
            width={width}
            height={height}
            ref={this.refCanvas}
          />
        </div>
      </div>
    );
  }
}
