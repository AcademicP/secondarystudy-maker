declare let html2pdf: any;

import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Antecedent } from '../models/antecedent.model';
import { FormsModule } from '@angular/forms'; 

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import jsPDF from 'jspdf';
import { Research } from '../models/research.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { ActivatedRoute, Router } from '@angular/router';
import { Criteria } from '../models/criteria.model';
import { Phase } from '../models/phase.model';
import { Question } from '../models/question.model';
import { Source } from '../models/source.model';

export interface DialogData {
  link: string;
}

@Component({
  selector: 'research-component',
  standalone: true,
  imports: [FormsModule, MatTooltipModule, MatButtonModule, MatInputModule,MatIconModule, MatButtonToggleModule],
  templateUrl: './research.component.html',
  styleUrl: './research.component.css'
})
export class ResearchComponent implements OnInit, OnDestroy {

  @ViewChild('contentToExport', { static: false }) contentToExport!: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private snackBar: MatSnackBar) {}

  private saveInterval: any;
  selectedCriteria:string="";

  research=new Research();
  viewmode='edit';

  ngOnInit():void{
    const research_=JSON.parse(localStorage.getItem('research')||'{}'); 
    if(research_.title) this.research=research_;
    localStorage.setItem('research',JSON.stringify(this.research));
     this.router.navigate(['/']);
    this.saveInterval = setInterval(() => {
      localStorage.setItem('research',JSON.stringify(this.research));
    }, 30000); 
   
  }

  ngOnDestroy(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
  }

  addCriteriaToPhase(phase_:Phase){
    let criteria =  this.research.inclusions.find(e=>e.code == this.selectedCriteria);
    if(!criteria) criteria = this.research.exclusions.find(e=>e.code == this.selectedCriteria);
    if(criteria) phase_.criterias.push(new Criteria(criteria.code, criteria.name));
  }

  addPhase(){
    this.research.phases.push( new Phase( "Fase "+(this.research.phases.length),[], [...this.research.sources] ) );
  }
  
  addAntecedentRow(){
    this.research.antecedents.push(new Antecedent('','','','','','',''));
    this.research.references = this.research.antecedents;
    this.makeRelatedWorkParagraph();
  }

  makeRelatedWorkParagraph(){
    this.research.relatedWorkParagragh=this.research.antecedents.filter(e=>e.authors).reduce((s, w) =>{
    const authorRegex= w.authors.match(/^(\w)\w+\s(\w*).*$/);  
    const reference =  authorRegex?`(${authorRegex[2]} ${authorRegex[1]}.,${w.year})`:'ERROR_REF';
      return s+`<p>El trabajo de <a href='${w.url}'>${reference}</a>, mediante un ${w.howto} hace ${w.objective}, sus resultados indican que ${w.results}.</p>`;
    },'');
  }

  changeObjective(){
    //this.research.problem= this.remakeProblem(this.research.objective, 'objective');
  }


  /*changeProblem(){
    this.research.objective=this.remakeObjective(this.research.problem, 'problem');
  }*/

  addQuestion(){
    this.research.questions.push(new Question( "RQ."+ (this.research.questions.length+1)));
  }
  addSource(){
    this.research.sources.push(new Source());
  }

 
  addInclusion(){
    this.research.inclusions.push(new Criteria( "CI."+(this.research.inclusions.length+1) ));
  }
  addExclusion(){
    this.research.exclusions.push(new Criteria( "CE."+(this.research.exclusions.length+1) ));
  }

  makeBaseQueryString(){
    const p = this.research.queryString.population.split(",");
    const i = this.research.queryString.intervention.split(",");
    const c = this.research.queryString.comparison.split(",");
    const o = this.research.queryString.outcome.split(",");
    const co = this.research.queryString.context.split(",");
    
    let picoc = p.map( e=> e.trim() ).join(" OR ") ;
    if(p.length>1) picoc = `(${picoc})`;
    if(this.research.queryString.intervention) {
      let data = i.map( e=> e.trim() ).join(" OR ") ;
      if(i.length>1) data = `(${data})`;
      picoc += " AND "+data;
    }
    if(this.research.queryString.comparison) {
      let data = c.map( e=> e.trim() ).join(" OR ") ;
      if(i.length>1) data = `(${data})`;
      picoc += " AND "+data;
    }
    
    if(this.research.queryString.outcome) {
      let data = c.map( e=> e.trim() ).join(" OR ") ;
      if(c.length>1) data = `(${data})`;
      picoc += " AND "+data;
    }
    if(this.research.queryString.context) {
      let data = co.map( e=> e.trim() ).join(" OR ") ;
      if(co.length>1) data = `(${data})`;
      picoc += " AND "+data;
    }

    this.research.queryString.base=picoc;
  }

  /*remakeProblem(data:string, type:string){
    let response = "";
    switch (type) {
      case 'objective':
        const regex_= data.match(/(\w*)\s(.*)/);
        response = `¿Cual es el grado de ${regex_?regex_[2]:''}?`;
        break;
    }
    return response;
   
  }*/

  /*remakeObjective(data:string, type:string){
    let response = "";
    switch (type) {
      case 'problem'://¿[Cual es el grado de] la aceptacion de las herramientas de monitoreo?
        const regexProblem= data.match(/¿Cual es el grado de (.*)\?/);
        response = `Determinar ${regexProblem?regexProblem[1]:''}`;
        break;
    }
    return response;
  }*/

  save(){
    localStorage.setItem('research',JSON.stringify(this.research) );
    this.snackBar.open('Guardado','',{duration:1000});
  }

  

  exportInDOCX() {
    this.viewmode='preview';

    setTimeout(()=>{
      const content = this.contentToExport.nativeElement.innerHTML;
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>";
      const body = '<head><meta charset="utf-8"></head><body>';
      const footer = '</body></html>';

      const sourceHTML = header + body + content + footer;
      const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      link.download = 'research.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },1000);
  }

  makeIntroduction(){
    this.research.introduction=`${this.research.context}. 
    Los antecedentes revisados muestran que ${this.research.antecedents_summary}.
    Por tanto, ${this.research.justification}.
    El objetivo de este estudio es ${this.research.objective}.
    El capitulo 2 explica el marco teorico, el capitul 3, los trabajos relacionados, el capitulo 4 la metodologia, el capitulo 5 los resultados, finalmente, las conclusiones y trabajos futuros.`;
  }


  exportInPDF(){
    const font="Times New Roman";
    let pdf = new jsPDF('p', 'mm', 'a4'); 
    let y=10;
    const fontSize = 12;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginLeft=20;
    const maxWidth = 240;
    const lineHeight = fontSize - 5;
    let lines: string[][]=[];

    this.makeIntroduction();

    /*pdf.setFontSize(16);
    pdf.setFont("Times New Roman", "bold");
    let textWidth = pdf.getTextWidth(this.title);
    lines.forEach((l:string) => {
      pdf.text(l, (pageWidth - textWidth) / 2, y);
      y += lineHeight;
    });*/
    
    //pdf.setFont(font, "normal");
    let lines_ = pdf.splitTextToSize(this.research.title, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e,'bold','14']) });
    lines.push([""]);
    lines.push(['ABSTRACT','bold']);
    lines.push(['...']);
    lines.push([""]);
    lines.push(['INTRODUCCION','bold']);

    lines_ = pdf.splitTextToSize(this.research.introduction, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });

    lines.push(['...']);
    lines.push([""]);
   
    lines.push(['TRABAJOS RELACIONADOS','bold']);
  
    lines_ = pdf.splitTextToSize(this.research.relatedWorkParagragh, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });
    lines.push([""]);

    lines.push(['METODOLOGIA','bold']);
    lines.push([""]);
    
    lines.push(['Preguntas de Investigación', 'bold']);
    this.research.questions.forEach(q => {
      lines_ = pdf.splitTextToSize(`${q.code}. ${q.name}`, maxWidth);
      lines_.forEach( (e:string)=>{ lines.push([e]) });
    });
    lines.push([""]);
    lines.push(['Cadena de Busqueda','bold']);

    lines_ = pdf.splitTextToSize(`(P): ${this.research.queryString.population||'-'}`, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });

    lines_ = pdf.splitTextToSize(`(I): ${this.research.queryString.intervention||'-'}`, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });

    lines_ = pdf.splitTextToSize(`(C): ${this.research.queryString.comparison||'-'}`, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });

    lines_ = pdf.splitTextToSize(`(O): ${this.research.queryString.outcome||'-'}`, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });
    lines_ = pdf.splitTextToSize(`(C): ${this.research.queryString.context||'-'}`, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });

    lines_ = pdf.splitTextToSize(`Cadena Base: ${this.research.queryString.base}`, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });


    lines.push([""]);
    lines_ = pdf.splitTextToSize("Esta cadena se aplicá a las fuentes de busqueda "+ this.research.sources.map(e=>e.name).join(','), maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });
    lines.push([""]);
   
    lines.push(['Criterios de Inclusion y Exclusion', 'bold']);
    this.research.inclusions.forEach(e=>{
      lines_ = pdf.splitTextToSize(`${e.code}. ${e.name}`, maxWidth);
      lines_.forEach( (e:string)=>{ lines.push([e]) });
    });
    this.research.exclusions.forEach(e=>{
      lines_ = pdf.splitTextToSize(`${e.code}. ${e.name}`, maxWidth);
      lines_.forEach( (e:string)=>{ lines.push([e]) });
    });
    lines.push([""]);
    lines.push(['Fases','bold']);
    lines.push([""]);

    lines.push(["FASE | TOTAL | CRITERIOS"]);

    this.research.phases.forEach(p=>{
      let criterias_='';
      let total_phase = 0;
      p.criterias.forEach(e=>{
        criterias_ += e.code+",";
      });
      p.sources.forEach(e=>{
        total_phase += e.count*1;
      });
      lines.push([p.name  + " | " + total_phase  + " | "+  criterias_]);
    });
    

    lines_ = pdf.splitTextToSize(this.research.methodology, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });
    lines.push([""]);

    lines.push(['RESULTADOS Y DISCUSIONES','bold']);

    this.research.questions.forEach(e=>{
      lines_ = pdf.splitTextToSize(`${e.code}. ${e.name}`, maxWidth);
      lines_.forEach( (e:string)=>{ lines.push([e,'bold']) });

      lines_ = pdf.splitTextToSize(e.answer, maxWidth);
      lines_.forEach( (e:string)=>{ lines.push([e]) });
    })
    
    lines_ = pdf.splitTextToSize(this.research.results, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });
    lines.push([""]);

    lines.push(['CONCLUSIONES','bold']);
    lines_ = pdf.splitTextToSize(this.research.conclusion, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });
    lines.push([""]);

    lines.push(['TRABAJOS FUTUROS','bold']);
    lines_ = pdf.splitTextToSize(this.research.futurework, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push([e]) });
    lines.push([""]);

    lines.push(['REFERENCIAS','bold']);
    this.research.references.forEach((e,i)=>{ lines.push(  pdf.splitTextToSize(`[${i+1}] ${e.authors} ${e.title}` , maxWidth) );});

    const pageHeight= pdf.internal.pageSize.getHeight();
    const marginTop=10;
    pdf.setFontSize(fontSize);

    lines.forEach((line) => {
      if (y + lineHeight > pageHeight - marginTop) {
        pdf.addPage();
        y = marginTop;
      }
      //[texto, fontWeight, fontSize]
      pdf.setFont(font,line[1]||'normal');
      const s = Number(line[2])*1;
      pdf.setFontSize(s||fontSize); 
      pdf.text(line[0], marginLeft, y);
      y += lineHeight; 
    });
    
    pdf.save('my-research.pdf');

  }

  shareMyResearch(){
    const str=JSON.stringify(this.research);
    const base64=btoa(str);
    console.log(base64);
    const link = location.href +"?r="+base64;
    this.openDialog(link);
  }

  readonly dialog = inject(MatDialog);

  openDialog(link:string): void {
    const dialogRef = this.dialog.open(ShareMyResearchDialog, {
      data: {link},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

}



@Component({
  selector: 'share-my-research-dialog',
  templateUrl: 'share-my-research-dialog.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class ShareMyResearchDialog {
  constructor(private clipboard: Clipboard) {}

  readonly dialogRef = inject(MatDialogRef<ShareMyResearchDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  //readonly animal = model(this.data.animal);

  onNoClick(): void { this.dialogRef.close();}

  copyLink(link:string): void {
    this.clipboard.copy(link);
    alert('Text copied to clipboard!');
  }
}