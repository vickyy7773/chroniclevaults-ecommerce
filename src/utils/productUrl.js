/**
 * Utility functions for generating product URLs
 */

/**
 * Converts a string to URL-friendly slug
 * @param {string} text - Text to convert
 * @returns {string} URL-friendly slug
 */
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start
    .replace(/-+$/, '');         // Trim - from end
};

/**
 * Generates hierarchical URL for a product
 * @param {Object} product - Product object with category, subCategory, name, slug
 * @returns {string} Product URL path
 */
export const getProductUrl = (product) => {
  if (!product) return '/';

  const category = slugify(product.category);
  const subcategory = slugify(product.subCategory);
  const productSlug = product.slug || slugify(product.name);

  // If category and subcategory exist, use hierarchical URL
  if (category && subcategory && productSlug) {
    return `/${category}/${subcategory}/${productSlug}`;
  }

  // Fallback to old URL format if slug/hierarchy is incomplete
  return `/product/${product._id || product.id}`;
};

/**
 * Extracts product info from hierarchical URL
 * @param {string} category - Category from URL params
 * @param {string} subcategory - Subcategory from URL params
 * @param {string} productSlug - Product slug from URL params
 * @returns {Object} Object with URL parts
 */
export const parseProductUrl = (category, subcategory, productSlug) => {
  return {
    category: category || null,
    subcategory: subcategory || null,
    productSlug: productSlug || null,
  };
};
