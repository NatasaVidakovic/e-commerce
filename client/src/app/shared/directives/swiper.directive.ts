import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swiper from 'swiper';
import { Navigation, Pagination, Scrollbar, Thumbs, EffectFade, EffectCube, EffectCoverflow, EffectFlip, EffectCreative } from 'swiper/modules';

declare global {
  interface Window {
    Swiper: any;
  }
}

@Directive({
  selector: '[swiper]',
  standalone: true
})
export class SwiperDirective implements AfterViewInit, OnDestroy, OnInit, OnChanges {
  @Input() config: any = {};
  @Input() navigation: boolean = false;
  @Input() pagination: boolean = false;
  @Input() scrollbar: boolean = false;
  @Input() thumbs: boolean = false;
  @Input() effect: string = 'slide';
  @Input() loop: boolean = true;
  @Input() autoplay: boolean = false;
  @Input() spaceBetween: number = 30;
  @Input() slidesPerView: number | 'auto' = 1;
  @Input() centeredSlides: boolean = false;
  @Input() breakpoints: any = {};

  private swiperInstance: Swiper | null = null;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    // Make Swiper available globally
    window.Swiper = Swiper;
  }

  ngAfterViewInit(): void {
    this.initializeSwiper();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.swiperInstance && changes['config']) {
      this.swiperInstance.destroy();
      this.initializeSwiper();
    }
  }

  ngOnDestroy(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy();
    }
  }

  private initializeSwiper(): void {
    const modules = [];
    
    if (this.navigation) modules.push(Navigation);
    if (this.pagination) modules.push(Pagination);
    if (this.scrollbar) modules.push(Scrollbar);
    if (this.thumbs) modules.push(Thumbs);
    if (this.effect === 'fade') modules.push(EffectFade);
    if (this.effect === 'cube') modules.push(EffectCube);
    if (this.effect === 'coverflow') modules.push(EffectCoverflow);
    if (this.effect === 'flip') modules.push(EffectFlip);
    if (this.effect === 'creative') modules.push(EffectCreative);

    const defaultConfig = {
      modules,
      navigation: this.navigation ? {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      } : false,
      pagination: this.pagination ? {
        el: '.swiper-pagination',
        clickable: true,
      } : false,
      scrollbar: this.scrollbar ? {
        el: '.swiper-scrollbar',
        draggable: true,
      } : false,
      effect: this.effect,
      loop: this.loop,
      autoplay: this.autoplay ? {
        delay: 3000,
        disableOnInteraction: false,
      } : false,
      spaceBetween: this.spaceBetween,
      slidesPerView: this.slidesPerView,
      centeredSlides: this.centeredSlides,
      breakpoints: this.breakpoints,
      ...this.config
    };

    this.swiperInstance = new Swiper(this.el.nativeElement, defaultConfig);
  }

  // Public methods for external control
  public getSwiper(): Swiper | null {
    return this.swiperInstance;
  }

  public slideNext(): void {
    if (this.swiperInstance) {
      this.swiperInstance.slideNext();
    }
  }

  public slidePrev(): void {
    if (this.swiperInstance) {
      this.swiperInstance.slidePrev();
    }
  }

  public slideTo(index: number): void {
    if (this.swiperInstance) {
      this.swiperInstance.slideTo(index);
    }
  }
}
