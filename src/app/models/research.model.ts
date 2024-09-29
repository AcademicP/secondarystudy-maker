import { Antecedent } from './antecedent.model';
import { Criteria } from './criteria.model';
import { Phase } from './phase.model';
import { QueryString } from './queryString.model';
import { Question } from './question.model';
import { Source } from './source.model';

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
      public methodology:string='',
      public results:string='',
      public conclusion:string='',
      public futurework:string='',
      public introduction:string='',
      public relatedWorkParagragh:string='',
      public references:Antecedent[]=[],
      public questions:Question[]=[new Question("RQ.1")],
      public sources:Source[]=[new Source()],
      public queryString:QueryString=new QueryString(),
      public inclusions:Criteria[]=[ new Criteria( "CI.1") ],
      public exclusions:Criteria[]=[ new Criteria("CE.1") ],
      public phases:Phase[]=[]
    ) {}
  }