import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Antecedent } from '../models/antecedent.model';
import { FormsModule } from '@angular/forms'; 

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

import jsPDF from 'jspdf';
import { Research } from '../models/research.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { ActivatedRoute, Router } from '@angular/router';

export interface DialogData {
  link: string;
}

@Component({
  selector: 'research-component',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatInputModule,MatIconModule, MatButtonToggleModule],
  templateUrl: './research.component.html',
  styleUrl: './research.component.css'
})
export class ResearchComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private router: Router) {}

  private saveInterval: any;

  research=new Research();
  viewmode='edit';

  ngOnInit():void{

    //verificar r
    this.route.queryParamMap.subscribe(params => {
      const r_ = params.get('r'); 
      if( r_ ) {
        this.research=JSON.parse(localStorage.getItem('research')||'{}'); 
        localStorage.setItem('research',JSON.stringify(this.research));
        this.router.navigate(['/']);
      }
    });

    this.saveInterval = setInterval(() => {
      localStorage.setItem('research',JSON.stringify(this.research));
    }, 30000); 
   
  }

  ngOnDestroy(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
  }


  

  
  addAntecedentRow(){
    this.research.antecedents.push(new Antecedent('','','','','','',''));
    this.research.references = this.research.antecedents;
  }

  makeRelatedWorkParagraph(){
    this.research.relatedWorkParagragh=this.research.antecedents.filter(e=>e.authors).reduce((s, w) =>{
    const authorRegex= w.authors.match(/^(\w)\w+\s(\w*).*$/);  
    const reference =  authorRegex?`(${authorRegex[2]} ${authorRegex[1]}.,${w.year})`:'ERROR_REF';
      return s+`<p>El trabajo de <a href='${w.url}'>${reference}</a>, mediante un ${w.howto} hace ${w.objective}, sus resultados indican que ${w.results}.</p>`;
    },'');
  }

  changeObjective(){
    this.research.hypothesis= this.remakeHypothesis(this.research.objective, 'objective');
    this.research.problem= this.remakeProblem(this.research.objective, 'objective');
  }

  changeHypothesis(){
    //this.objective=this.remakeObjective(this.hypothesis, 'hypothesis');
    //this.problem=this.remakeProblem(this.hypothesis, 'hypothesis');
  }

  changeProblem(){
    this.research.objective=this.remakeObjective(this.research.problem, 'problem');
    this.research.hypothesis=this.remakeHypothesis(this.research.problem, 'problem');
  }

  remakeProblem(data:string, type:string){
    let response = "";
    switch (type) {
      case 'objective'://[Determinar el grado de] la aceptacion tecnologia de las herramientas de monitoreo
        const regex_= data.match(/(\w*)\s(.*)/);
        response = `¿Cual es el grado de ${regex_?regex_[2]:''}?`;
        break;
    }
    return response;
   
  }
  remakeObjective(data:string, type:string){

    let response = "";
    switch (type) {
      case 'problem'://¿[Cual es el grado de] la aceptacion de las herramientas de monitoreo?
        const regexProblem= data.match(/¿Cual es el grado de (.*)\?/);
        response = `Determinar ${regexProblem?regexProblem[1]:''}`;
        break;
    }
    return response;
    
  }

  remakeHypothesis(data:string, type:string){
    let response = "";
    switch (type) {
      case 'problem'://¿[Cual es el grado de] la aceptacion de las herramientas de monitoreo?
        const regex_= data.match(/¿Cual es el grado de (.*)\?/);
        response = `${regex_?regex_[1]:''} es alto`;
        break;
        case 'objective'://[Determinar el grado de] la aceptacion tecnologia de las herramientas de monitoreo
        const regex__= data.match(/(\w*)\s(.*)/);
        response = `${regex__?regex__[2]:''} es alto`;
        break;
    }
    return response;
  }

  makeIntroduction(){
    this.research.introduction=`${this.research.context}. 
    Los antecedentes revisados muestran que ${this.research.antecedents_summary}. 
    Sin embargo, ${this.research.problem_afirmative}.
    Por tanto, ${this.research.justification}.
    El objetivo de este estudio es ${this.research.objective}.
    El capitulo 2 explica el marco teorico, el capitul 3, los trabajos relacionados, el capitulo 4 la metodologia, el capitulo 5 los resultados, finalmente, las conclusiones y trabajos futuros.`;
  }

  exportInPDF(){
    let pdf = new jsPDF('p', 'mm', 'a4'); 
    let y=10;
    const fontSize = 12;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginLeft=10;
    const maxWidth = 180;
    const lineHeight = fontSize - 5;
    let lines: string[]=[];

    this.makeIntroduction();


    /*pdf.setFontSize(16);
    pdf.setFont("Times New Roman", "bold");
    let textWidth = pdf.getTextWidth(this.title);
    lines.forEach((l:string) => {
      pdf.text(l, (pageWidth - textWidth) / 2, y);
      y += lineHeight;
    });*/
    
    pdf.setFont("Times New Roman", "normal");
    let lines_ = pdf.splitTextToSize(this.research.title, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push(e) });
    lines.push('ABSTRACT');
    lines.push('...');
    lines.push('INTRODUCCION');

    lines_ = pdf.splitTextToSize(this.research.introduction, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push(e) });
    lines.push('TEORIA DE FONDO');
    lines.push('...');

    lines.push('TRABAJOS RELACIONADOS');
    lines_ = pdf.splitTextToSize(this.research.relatedWorkParagragh, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push(e) });

    lines.push('METODOLOGIA');
    lines_ = pdf.splitTextToSize(this.research.methodology, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push(e) });

    lines.push('RESULTADOS Y DISCUSIONES');
    lines_ = pdf.splitTextToSize(this.research.results, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push(e) });

    lines.push('CONCLUSIONES');
    lines_ = pdf.splitTextToSize(this.research.conclusion, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push(e) });

    lines.push('TRABAJOS FUTUROS');
    lines_ = pdf.splitTextToSize(this.research.futurework, maxWidth);
    lines_.forEach( (e:string)=>{ lines.push(e) });

    lines.push('REFERENCIAS');
    this.research.references.forEach((e,i)=>{ lines.push(`[${i+1}] ${e.authors} ${e.title}`);});

    const pageHeight= pdf.internal.pageSize.getHeight();
    const marginTop=10;
    pdf.setFontSize(fontSize);
    lines.forEach((line) => {
      if (y + lineHeight > pageHeight - marginTop) {
        pdf.addPage();
        y = marginTop;
      }
      pdf.text(line, marginLeft, y);
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