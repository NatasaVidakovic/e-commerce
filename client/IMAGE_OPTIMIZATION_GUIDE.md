# Image Optimization & Responsive Images Guide

## Overview
This guide provides instructions for implementing responsive images with srcset, converting to modern formats, and preventing Cumulative Layout Shift (CLS).

---

## 1. Responsive Images with srcset

### Basic Implementation

```html
<!-- Single image with multiple sizes -->
<img 
  src="product-400w.jpg"
  srcset="
    product-400w.jpg 400w,
    product-800w.jpg 800w,
    product-1200w.jpg 1200w,
    product-1600w.jpg 1600w
  "
  sizes="
    (max-width: 425px) 100vw,
    (max-width: 768px) 50vw,
    (max-width: 1024px) 33vw,
    25vw
  "
  alt="Product name"
  loading="lazy"
  width="400"
  height="400"
>
```

### Angular Component Example

```typescript
// product-item.component.ts
export class ProductItemComponent {
  @Input() product!: Product;
  
  getImageSrcset(baseUrl: string): string {
    return `
      ${baseUrl}?w=400 400w,
      ${baseUrl}?w=800 800w,
      ${baseUrl}?w=1200 1200w,
      ${baseUrl}?w=1600 1600w
    `;
  }
  
  getImageSizes(): string {
    return `
      (max-width: 425px) 100vw,
      (max-width: 768px) 50vw,
      (max-width: 1024px) 33vw,
      25vw
    `;
  }
}
```

```html
<!-- product-item.component.html -->
<img 
  [src]="product.pictureUrl"
  [srcset]="getImageSrcset(product.pictureUrl)"
  [sizes]="getImageSizes()"
  [alt]="'Image of ' + product.name"
  loading="lazy"
  width="400"
  height="400"
>
```

---

## 2. Modern Image Formats (WebP/AVIF)

### Using Picture Element

```html
<picture>
  <!-- AVIF format (best compression) -->
  <source 
    type="image/avif"
    srcset="
      product-400w.avif 400w,
      product-800w.avif 800w,
      product-1200w.avif 1200w
    "
    sizes="(max-width: 768px) 100vw, 50vw"
  >
  
  <!-- WebP format (good compression, wide support) -->
  <source 
    type="image/webp"
    srcset="
      product-400w.webp 400w,
      product-800w.webp 800w,
      product-1200w.webp 1200w
    "
    sizes="(max-width: 768px) 100vw, 50vw"
  >
  
  <!-- Fallback to JPEG -->
  <img 
    src="product-800w.jpg"
    srcset="
      product-400w.jpg 400w,
      product-800w.jpg 800w,
      product-1200w.jpg 1200w
    "
    sizes="(max-width: 768px) 100vw, 50vw"
    alt="Product name"
    loading="lazy"
    width="800"
    height="800"
  >
</picture>
```

### Angular Picture Component

```typescript
// responsive-image.component.ts
@Component({
  selector: 'app-responsive-image',
  template: `
    <picture>
      <source 
        *ngIf="avifSrcset"
        type="image/avif"
        [srcset]="avifSrcset"
        [sizes]="sizes"
      >
      <source 
        *ngIf="webpSrcset"
        type="image/webp"
        [srcset]="webpSrcset"
        [sizes]="sizes"
      >
      <img 
        [src]="src"
        [srcset]="srcset"
        [sizes]="sizes"
        [alt]="alt"
        [loading]="loading"
        [width]="width"
        [height]="height"
      >
    </picture>
  `
})
export class ResponsiveImageComponent {
  @Input() src!: string;
  @Input() srcset?: string;
  @Input() webpSrcset?: string;
  @Input() avifSrcset?: string;
  @Input() sizes!: string;
  @Input() alt!: string;
  @Input() loading: 'lazy' | 'eager' = 'lazy';
  @Input() width?: number;
  @Input() height?: number;
}
```

---

## 3. Preventing Cumulative Layout Shift (CLS)

### Always Specify Width and Height

```html
<!-- ✅ GOOD: Prevents layout shift -->
<img 
  src="product.jpg"
  alt="Product"
  width="400"
  height="400"
  loading="lazy"
>

<!-- ❌ BAD: Causes layout shift -->
<img 
  src="product.jpg"
  alt="Product"
  loading="lazy"
>
```

### Using Aspect Ratio

```scss
// For responsive images with aspect ratio
.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1; // or 16 / 9, 4 / 3, etc.
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```

### Fallback for Older Browsers

```scss
.image-container {
  position: relative;
  width: 100%;
  
  // Fallback for browsers without aspect-ratio support
  &::before {
    content: '';
    display: block;
    padding-top: 100%; // 1:1 aspect ratio
  }
  
  // Modern browsers
  @supports (aspect-ratio: 1 / 1) {
    aspect-ratio: 1 / 1;
    
    &::before {
      display: none;
    }
  }
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```

---

## 4. Image Conversion Tools

### Command Line Tools

```bash
# Install ImageMagick
# Convert JPEG to WebP
magick convert input.jpg -quality 85 output.webp

# Convert JPEG to AVIF
magick convert input.jpg -quality 85 output.avif

# Generate multiple sizes
magick convert input.jpg -resize 400x400 output-400w.jpg
magick convert input.jpg -resize 800x800 output-800w.jpg
magick convert input.jpg -resize 1200x1200 output-1200w.jpg
```

### Node.js Script

```javascript
// generate-responsive-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [400, 800, 1200, 1600];
const formats = ['jpg', 'webp', 'avif'];

async function generateResponsiveImages(inputPath, outputDir) {
  const filename = path.parse(inputPath).name;
  
  for (const size of sizes) {
    for (const format of formats) {
      const outputPath = path.join(
        outputDir, 
        `${filename}-${size}w.${format}`
      );
      
      await sharp(inputPath)
        .resize(size, size, { fit: 'cover' })
        .toFormat(format, { quality: 85 })
        .toFile(outputPath);
      
      console.log(`Generated: ${outputPath}`);
    }
  }
}

// Usage
const inputDir = './public/images/products';
const outputDir = './public/images/products/optimized';

fs.readdirSync(inputDir).forEach(file => {
  if (file.match(/\.(jpg|jpeg|png)$/i)) {
    generateResponsiveImages(
      path.join(inputDir, file),
      outputDir
    );
  }
});
```

---

## 5. Implementation Checklist

### For Each Image Type

**Product Images:**
- [ ] Generate 4 sizes: 400w, 800w, 1200w, 1600w
- [ ] Convert to WebP and AVIF
- [ ] Add srcset with appropriate sizes
- [ ] Specify width and height attributes
- [ ] Add lazy loading
- [ ] Test on various devices

**Hero Images:**
- [ ] Generate 5 sizes: 640w, 1024w, 1366w, 1920w, 2560w
- [ ] Convert to WebP and AVIF
- [ ] Add srcset with appropriate sizes
- [ ] Specify width and height attributes
- [ ] Use eager loading (above fold)
- [ ] Test on various devices

**Thumbnail Images:**
- [ ] Generate 2 sizes: 100w, 200w
- [ ] Convert to WebP and AVIF
- [ ] Add srcset with appropriate sizes
- [ ] Specify width and height attributes
- [ ] Add lazy loading
- [ ] Test on various devices

---

## 6. CDN Configuration

### Cloudinary Example

```typescript
// image.service.ts
export class ImageService {
  private cloudinaryUrl = 'https://res.cloudinary.com/your-cloud/image/upload';
  
  getResponsiveUrl(publicId: string, width: number, format: string = 'auto'): string {
    return `${this.cloudinaryUrl}/w_${width},f_${format},q_auto/${publicId}`;
  }
  
  getSrcset(publicId: string): string {
    const sizes = [400, 800, 1200, 1600];
    return sizes
      .map(w => `${this.getResponsiveUrl(publicId, w)} ${w}w`)
      .join(', ');
  }
}
```

### imgix Example

```typescript
// image.service.ts
export class ImageService {
  private imgixUrl = 'https://your-domain.imgix.net';
  
  getResponsiveUrl(path: string, width: number): string {
    return `${this.imgixUrl}${path}?w=${width}&auto=format,compress&q=85`;
  }
  
  getSrcset(path: string): string {
    const sizes = [400, 800, 1200, 1600];
    return sizes
      .map(w => `${this.getResponsiveUrl(path, w)} ${w}w`)
      .join(', ');
  }
}
```

---

## 7. Performance Monitoring

### Measure CLS

```javascript
// cls-monitor.ts
export function monitorCLS() {
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        clsEntries.push(entry);
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });

  // Report CLS when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('CLS:', clsValue);
      // Send to analytics
    }
  });
}
```

### Lighthouse CI

```yaml
# .lighthouserc.yml
ci:
  collect:
    numberOfRuns: 3
    settings:
      preset: 'desktop'
  assert:
    assertions:
      'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      'largest-contentful-paint': ['error', { maxNumericValue: 2500 }]
      'first-contentful-paint': ['error', { maxNumericValue: 1800 }]
  upload:
    target: 'temporary-public-storage'
```

---

## 8. Best Practices Summary

✅ **Always specify width and height** on images
✅ **Use srcset** for responsive images
✅ **Provide multiple formats** (AVIF, WebP, JPEG)
✅ **Use lazy loading** for below-fold images
✅ **Use eager loading** for above-fold images
✅ **Optimize image quality** (85% is usually sufficient)
✅ **Use CDN** for automatic format conversion
✅ **Monitor CLS** in production
✅ **Test on real devices** with slow networks
✅ **Use aspect-ratio** to reserve space

---

## 9. Migration Strategy

### Phase 1: Add Dimensions
1. Add width and height to all existing images
2. Test for CLS improvements
3. Deploy to production

### Phase 2: Add Lazy Loading
1. Add loading="lazy" to below-fold images
2. Test loading behavior
3. Deploy to production

### Phase 3: Generate Responsive Images
1. Generate multiple sizes for all images
2. Store in CDN or static folder
3. Test file sizes and loading

### Phase 4: Implement srcset
1. Update image components with srcset
2. Test on various devices
3. Deploy to production

### Phase 5: Add Modern Formats
1. Generate WebP and AVIF versions
2. Implement picture element
3. Test browser support
4. Deploy to production

---

## 10. Resources

- [MDN: Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [web.dev: Optimize Images](https://web.dev/fast/#optimize-your-images)
- [web.dev: Cumulative Layout Shift](https://web.dev/cls/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [imgix Documentation](https://docs.imgix.com/)
