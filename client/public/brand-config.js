// Set to 'default' for the original Web Shop, or 'noli' for the Noli experience.
// Reload the page after editing. This file is also editable after deployment.
window.shopBrand = 'noli';
document.documentElement.dataset.brand = window.shopBrand === 'noli' ? 'noli' : 'default';
