import { Criteria } from "./criteria.model";
import { Source } from "./source.model";

export class Phase {
    constructor(
      public name: string="",
      public criterias:Criteria[]=[],
      public sources:Source[]=[],
    ) {}
  }