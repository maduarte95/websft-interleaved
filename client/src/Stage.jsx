import {
  usePlayer,
  useRound,
  useStage,
  usePlayers
} from "@empirica/core/player/classic/react";
import { Loading } from "@empirica/core/player/react";
import React from "react";
import { VerbalFluencyCollab } from "./stages/VerbalFluencyCollab";
import { HHInterleaved } from "./stages/HHInterleaved";
import { SwitchesId } from "./stages/SwitchesId";
import { Labelling } from "./stages/Labelling";

export function Stage() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const stage = useStage();

  if (player.stage.get("submit")) {
    if (players.length === 1) {
      return <Loading />;
    }
    return (
      <div className="text-center text-gray-400 pointer-events-none">
        Please wait for other player(s).
      </div>
    );
  }

  switch (round.get("name")) {
    // case "testRound":
      // switch (stage.get("name")) {
      //   case "LocalAPI":
      //     return <LocalAPI />;
      //   default:
      //     return <Loading />;
      // }
    // case "HHCollab":
    //   switch (stage.get("name")) {
    //     case "HHCollab":
    //       return <HHCollab />;
    //     case "SwitchesId":
    //       return <SwitchesId />;
    //     case "HHCollabResult":
    //       return <Result />;
    //     default:
    //       return <Loading />;
    //   }
    // case "HHCollabSwitched":
    //   switch (stage.get("name")) {
    //     case "HHCollabSwitched":
    //       return <HHCollab />;
    //     case "SwitchesId":
    //       return <SwitchesId />;
    //     case "HHCollabResult":
    //       return <Result />;
    //     default:
    //       return <Loading />;
    //   }
    case "Interleaved1":
    case "Interleaved2":
      switch (stage.get("name")) {
        case "HHInterleaved":
          return <HHInterleaved />;
        case "VerbalFluencyCollab":
          return <VerbalFluencyCollab />;
        case "Labelling":
          return <Labelling />;
        case "SwitchesId":
          return <SwitchesId />;
        default:
          return <Loading />;
      }
    // case "VerbalFluencyTask":
    //   switch (stage.get("name")) {
    //     case "VerbalFluencyTask":
    //       return <VerbalFluencyTask />;
    //     case "VFResult":
    //       return <Result />;
    //     case "SwitchesId":
    //       return <SwitchesId />;
    //     default:
    //       return <Loading />;
    //   }
    default:
      return <Loading />;
  }
}