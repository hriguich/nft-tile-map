import React, { useState } from "react";
import { TileMap, Layer } from "./index";
import { useRouter } from "../node_modules/next/router";

const T = React.memo(() => {
  const router = useRouter();
  const [selectedTile, setSelectedTile] = useState<SelectedTile>({
    tiles: [],
    tileInfo: {},
  });
  // const [hover, setHover] = useState({ x: 0, y: 0 });
  // const isPositive = (x: number, y: number) => x > 0 && y > 0;

  // // const positiveLayer: Layer = (x, y) => {
  // //   return {
  // //     color: isPositive(x, y) ? "#cccccc" : "#888888",
  // //   };
  // // };

  // // const hoverLayer: Layer = (x, y) => {
  // //   return hover.x === x && hover.y === y
  // //     ? { color: isPositive(x, y) ? "#ff0000" : "#00ff00" }
  // //     : null;
  // // };

  type SelectedTile = {
    tiles;
    tileInfo;
  };

  type AtlasTile = {
    x: number;
    y: number;
    type: number;
    district_id?: number;
    estate_id?: number;
    left?: number;
    top?: number;
    topLeft?: number;
    price?: number;
    owner?: string;
    image?: string;
    landId?: number;
    zone?: number;
    isHighTraffic?: boolean;
    billboard?: string;
  };

  let atlas: Record<string, AtlasTile> | null = null;

  async function loadTiles() {
    const config = require("./data.json");
    // const resp = await fetch("https://api.decentraland.org/v1/tiles");
    const json = config;
    atlas = json.data as Record<string, AtlasTile>;
  }

  loadTiles().catch(console.error);

  const COLOR_BY_TYPE = Object.freeze({
    0: "#ff9990", // my parcels
    5: "#5054D4", // districts
    6: "#563db8", // contributions
    7: "#716C7A", // roads
    8: "#FF2E63", // plazas
    9: "#252A34", // owned parcel/estate
    10: "#3D3A46", // parcels on sale (we show them as owned parcels)
    12: "#18141a", // background
    13: "#110e13", // loading odd
    14: "#0d0b0e", // loading even
  });

  const STRING_TYPE = Object.freeze({
    0: "villa", // my parcels
    5: "villa", // villa
    6: "standard", // contributions
    7: "roads", // roads
    8: "exclusive", // exclusive
    9: "standard", // standard
    10: "deluxe", // deluxe
  });

  const SQUARE_BY_TYPE = Object.freeze({
    0: "#ff9990", // my parcels
    5: 13456, // villa
    6: "#563db8", // contributions
    7: "#716C7A", // roads
    8: 30625, // exclusive
    9: 729, // standard
    10: 4356, // deluxe
    12: "#18141a", // background
    13: "#110e13", // loading odd
    14: "#0d0b0e", // loading even
  });

  let selected = [];

  // useEffect(() => {
  //   console.log(context);
  // }, [context]);

  function isSelected(x: number, y: number) {
    return selectedTile?.tiles?.some((coord) => coord.x === x && coord.y === y);
  }

  const atlasLayer: Layer = (x, y) => {
    const id = x + "," + y;
    if (atlas !== null && id in atlas) {
      const tile = atlas[id];
      const color = COLOR_BY_TYPE[tile.type];

      const top = !!tile.top;
      const left = !!tile.left;
      const topLeft = !!tile.topLeft;
      const owner = tile.owner;
      const type = tile.type;
      const estateId = tile.estate_id;
      const image = tile.image;
      const price = tile.price;
      const landId = tile.landId;
      const zone = tile.zone;
      const isHighTraffic = tile.isHighTraffic;
      const billboard = tile.billboard;

      return {
        color,
        top,
        left,
        topLeft,
        owner,
        type,
        estateId,
        image,
        price,
        landId,
        zone,
        isHighTraffic,
        billboard,
      };
    } else {
      return {
        color: (x + y) % 2 === 0 ? COLOR_BY_TYPE[13] : COLOR_BY_TYPE[13],
        type: 6,
      };
    }
  };

  const onSaleLayer: Layer = (x, y) => {
    const id = x + "," + y;
    if (atlas && id in atlas && atlas[id].price) {
      const color = "#00d3ff";
      const top = !!atlas[id].top;
      const left = !!atlas[id].left;
      const topLeft = !!atlas[id].topLeft;
      return {
        color,
        top,
        left,
        topLeft,
      };
    }
    return null;
  };

  const selectedStrokeLayer: Layer = (x, y) => {
    return isSelected(x, y) ? { color: "#ff0044", scale: 1.4 } : null;
  };

  const selectedFillLayer: Layer = (x, y) => {
    return isSelected(x, y) ? { color: "#ff9990", scale: 1.2 } : null;
  };
  return (
    <>
      <div className="flex flex-col items-center ">
        <div
          className=" rounded-xl overflow-hidden drop-shadow-xl "
          style={{ width: "90vw", height: "65vh" }}
        >
          <TileMap
            className="atlas"
            layers={[
              atlasLayer,
              onSaleLayer,
              selectedStrokeLayer,
              selectedFillLayer,
              // hoverLayer,
            ]}
            onClick={(tiles, tileInfo) => {
              if (isSelected(tiles[0].x, tiles[0].y)) {
                setSelectedTile({ tiles: [], tileInfo: {} });
              } else {
                console.log(tileInfo);
                setSelectedTile({ tiles, tileInfo });
              }
            }}
            // onHover={(x, y) => setHover({ x, y })}
            onPopup={(state) => {}}
            SQUARE_BY_TYPE={SQUARE_BY_TYPE}
          />
        </div>
        <div className="flex w-[85vw] ">
          <div className=" mt-10 w-full bg-white drop-shadow-md rounded-lg">
            {selectedTile?.tileInfo?.type ? (
              <div className="m-10 flex justify-between">
                <div>
                  <span className="text-xl font-semibolds">
                    {selectedTile?.tiles.length === 1
                      ? `Coords (${selectedTile?.tiles[0].x},${selectedTile?.tiles[0].y})`
                      : `Coords (${selectedTile?.tiles[0].x},${
                          selectedTile?.tiles[0].y
                        }) : (${
                          selectedTile?.tiles[selectedTile?.tiles.length - 1].x
                        },${
                          selectedTile?.tiles[selectedTile?.tiles.length - 1].y
                        })`}
                  </span>
                  <span className="flex space-x-2 mt-5">
                    <h2 className="font-semibold">Land id:</h2>

                    <p> {selectedTile?.tileInfo?.landId}</p>
                  </span>
                  <span className="flex space-x-2">
                    <h2 className="font-semibold">owner:</h2>

                    <p> {selectedTile?.tileInfo?.owner}</p>
                  </span>
                  <span className="flex space-x-2 ">
                    <h2 className="font-semibold">Type:</h2>
                    <p> {STRING_TYPE[selectedTile?.tileInfo?.type]}</p>
                  </span>
                  <span className="flex space-x-2 ">
                    <h2 className="font-semibold">Square meters:</h2>
                    <p> {SQUARE_BY_TYPE[selectedTile?.tileInfo?.type]}</p>
                  </span>
                  <span className="flex space-x-2 ">
                    <h2 className="font-semibold">Zone:</h2>
                    <p> {selectedTile?.tileInfo?.zone}</p>
                  </span>
                  <span className="flex space-x-2 ">
                    <h2 className="font-semibold">Billboard:</h2>
                    <p> {selectedTile?.tileInfo?.billboard}</p>
                  </span>
                  <span className="flex space-x-2 mt-5 ">
                    {selectedTile?.tileInfo?.isHighTraffic ? (
                      <p className="text-red-800 font-semibold">
                        High traffic Area
                      </p>
                    ) : (
                      <p className="text-green-800 font-semibold">
                        {" "}
                        Low traffic area
                      </p>
                    )}
                  </span>
                </div>
                <div>
                  {selectedTile?.tileInfo?.price && (
                    <span className="flex flex-col justify-center items-center">
                      <h2 className="font-semibold text-lg">Price</h2>
                      <p> {selectedTile?.tileInfo?.price} </p>
                    </span>
                  )}
                  <div
                    onClick={() => {
                      router.replace("/modelviewer?type=1");
                    }}
                    className="cursor-pointer mt-6 p-4 bg-[#252A34] text-white rounded-lg"
                  >
                    <button>Go in</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[#252A34] p-16 text-center font-semibold">
                Selecte a Tile first
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default T;
