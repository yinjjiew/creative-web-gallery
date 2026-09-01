import type { ComponentType } from "react";

import { ApiCivil } from "./ApiCivil";
import { ApiClock } from "./ApiClock";
import { ApiIndex } from "./ApiIndex";
import { ApiInstant } from "./ApiInstant";
import { ApiParse } from "./ApiParse";
import { ApiSpan } from "./ApiSpan";
import { ApiZone } from "./ApiZone";
import { Ambiguous } from "./Ambiguous";
import { CalendarMath } from "./CalendarMath";
import { Home } from "./Home";
import { InstantCivil } from "./InstantCivil";
import { Limits } from "./Limits";
import { Migrate } from "./Migrate";
import { MigrateV2 } from "./MigrateV2";
import { MigrateV21 } from "./MigrateV21";
import { Start } from "./Start";
import { Zones } from "./Zones";

export const CONTENT: Record<string, ComponentType> = {
  "": Home,
  start: Start,
  "concepts/instant-civil": InstantCivil,
  "concepts/zones": Zones,
  "concepts/ambiguous": Ambiguous,
  "concepts/calendar": CalendarMath,
  api: ApiIndex,
  "api/instant": ApiInstant,
  "api/civil": ApiCivil,
  "api/clock": ApiClock,
  "api/span": ApiSpan,
  "api/zone": ApiZone,
  "api/parse": ApiParse,
  limits: Limits,
  migrate: Migrate,
  "migrate/v2": MigrateV2,
  "migrate/v21": MigrateV21,
};
