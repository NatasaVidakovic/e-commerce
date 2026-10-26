import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AboutComponent } from '../../about/about.component';
import { SwiperDirective } from '../../../shared/directives/swiper.directive';
@Component({
  selector: 'app-lumen-about',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    MatIconModule,
    MatButtonModule,
    SwiperDirective,
  ],
  templateUrl: './lumen-about.component.html',
  styleUrl: './lumen-about.component.scss',
})
export class LumenAboutComponent extends AboutComponent {
  // These bundled illustrations belong to Noli. Merchant uploads stay available.
  override readonly galleryImages = computed(() =>
    this.config().galleryImages.filter(
      (image) =>
        !/^(?:https?:\/\/[^/]+)?\/?brand\/noli-[^/?#]+\.(?:png|webp|jpe?g|avif|svg)(?:[?#].*)?$/i.test(
          image,
        ),
    ),
  );
}
