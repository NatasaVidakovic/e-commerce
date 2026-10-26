import { BrandingService } from '../../core/services/branding.service';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Only bundled Noli catalog text is translated; merchant-entered copy stays intact.
export const NOLI_CATALOG_KEYS: Readonly<Record<string, string>> = {
  'Nakit': 'NOLI.JEWELRY',
  'Mirisne svijeće': 'NOLI.CANDLES',
  'Nježno jutro': 'CATALOG.GENTLE_MORNING',
  'Topli zagrljaj': 'CATALOG.WARM_HUG',
  'Narukvica od perlica u nježnim ružičastim tonovima. Mali detalj za svaki dan ili pažljivo odabran poklon.': 'CATALOG.ROSA_DESCRIPTION',
  'Ručno rađena narukvica od perlica u krem i žalfija tonovima. Nježan podsjetnik na male radosti.': 'CATALOG.LUNA_DESCRIPTION',
  'Mirisna svijeća za lagan početak dana i trenutke koji pripadaju samo tebi. Ručno izrađena s pažnjom.': 'CATALOG.MORNING_DESCRIPTION',
  'Mirisna svijeća za mirne večeri, omiljenu knjigu i osjećaj doma. Mali ritual topline, od srca.': 'CATALOG.HUG_DESCRIPTION',
  'Male stvari, veliki osjećaj. Ručno rađeni nakit i mirisne svijeće za tvoje male rituale.': 'CATALOG.COMPANY_DESCRIPTION',
  'Ručno rađeni nakit od pažljivo odabranih perlica.': 'CATALOG.JEWELRY_DESCRIPTION',
  'Mirisne svijeće za nježne svakodnevne rituale.': 'CATALOG.CANDLES_DESCRIPTION'
};

@Pipe({
  name: 'catalogText', standalone: true, pure: false
})
export class CatalogTextPipe implements PipeTransform {
  readonly branding = inject(BrandingService);

  private translate = inject(TranslateService);
  transform(value: string | null | undefined, context?: string): string {
    if (value && context === 'option') {
      const key = 'FILTER_OPTIONS.' + value;
      const label = this.translate.instant(key);
      if (label !== key) return label;
    }
    return value ? this.translate.instant((this.branding.isNoli() && NOLI_CATALOG_KEYS[value]) || value) : '';
  }

}
