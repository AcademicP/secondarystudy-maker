import { Antecedent } from './antecedent.model';

export class Research {
    constructor(
      public title:string='',
      public context:string='',
      public antecedents_summary:string='',
      public problem_afirmative:string='',
      public justification:string='',
      public antecedents:Antecedent[]=[new Antecedent('','','','','','','')],
      public type:string='',
      public objective:string='',
      public problem:string='',
      public hypothesis:string='',
      public methodology:string='',
      public results:string='',
      public conclusion:string='',
      public futurework:string='',
      public introduction:string='',
      public relatedWorkParagragh:string='',
      public references:Antecedent[]=[],
    ) {}
  }