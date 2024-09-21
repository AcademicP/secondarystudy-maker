import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ResearchComponent } from './research/research.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,ResearchComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Secondary Study Maker';
}
