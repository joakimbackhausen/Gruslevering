/**
 * Import products from the existing Express scraper into Strapi
 * Run: node import-products.mjs
 */

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = '63d9f15a085f795329fe40f2487ab4e93d084faa698647244a72975534f230a5c3b997493c2bef04a2ccb4b86b0f087a84f189176f43c1456fc63ba9cba964158521aee2d2458311f616b89d5c84e54d3a763e903d225a6ddeb29b5a587d76a60c9d470740915a15d0dd016d6897c2b58efe04705a44da68c1f21eea99a9fb0c';
const EXPRESS_URL = 'http://localhost:3001'; // or 3000

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
};

async function fetchFromExpress(endpoint) {
  // Try port 3001 first, then 3000
  for (const port of [3001, 3000]) {
    try {
      const res = await fetch(`http://localhost:${port}${endpoint}`);
      if (res.ok) return res.json();
    } catch {}
  }
  throw new Error(`Failed to fetch ${endpoint} from Express`);
}

async function createCategory(data) {
  const res = await fetch(`${STRAPI_URL}/api/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  const json = await res.json();
  if (json.error) {
    console.error(`  Error creating category ${data.name}:`, json.error.message);
    return null;
  }
  return json.data;
}

async function publishCategory(documentId) {
  // Categories have draftAndPublish: false, so they're published by default
  return true;
}

async function createProduct(data) {
  const res = await fetch(`${STRAPI_URL}/api/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  const json = await res.json();
  if (json.error) {
    console.error(`  Error creating product ${data.title}:`, json.error.message);
    return null;
  }
  return json.data;
}

async function publishProduct(documentId) {
  const res = await fetch(`${STRAPI_URL}/api/products/${documentId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
  });
  return res.ok;
}

async function main() {
  console.log('Fetching categories from Express...');
  const categories = await fetchFromExpress('/api/categories');
  console.log(`Found ${categories.length} categories`);

  console.log('Fetching products from Express...');
  const products = await fetchFromExpress('/api/products');
  console.log(`Found ${products.length} products`);

  // Create categories first (parents, then children)
  const parentCats = categories.filter(c => c.parentId === null);
  const childCats = categories.filter(c => c.parentId !== null);
  const catMap = new Map(); // slug -> strapi documentId

  console.log('\n--- Creating parent categories ---');
  for (const cat of parentCats) {
    const created = await createCategory({
      name: cat.name,
      slug: cat.slug,
      image: cat.image || '',
      externalId: cat.id,
      url: cat.url || '',
    });
    if (created) {
      catMap.set(cat.slug, created.documentId);
      console.log(`  ✓ ${cat.name} (${cat.slug})`);
    }
  }

  console.log('\n--- Creating child categories ---');
  for (const cat of childCats) {
    // Find parent's strapi documentId
    const parentCat = categories.find(c => c.id === cat.parentId);
    const parentDocId = parentCat ? catMap.get(parentCat.slug) : null;

    const data = {
      name: cat.name,
      slug: cat.slug,
      image: cat.image || '',
      externalId: cat.id,
      url: cat.url || '',
    };
    if (parentDocId) {
      data.parent = { documentId: parentDocId };
    }

    const created = await createCategory(data);
    if (created) {
      catMap.set(cat.slug, created.documentId);
      console.log(`  ✓ ${cat.name} (${cat.slug}) → parent: ${parentCat?.name || 'none'}`);
    }
  }

  console.log(`\nCreated ${catMap.size} categories`);

  // Create products
  console.log('\n--- Creating products ---');
  let created = 0;
  for (const product of products) {
    const catDocId = catMap.get(product.categorySlug);

    const data = {
      title: product.title,
      sku: product.sku || '',
      price: product.price,
      currency: product.currency || 'DKK',
      description: product.description || '',
      image: product.image || '',
      images: product.images || [],
      externalId: product.id,
      url: product.url || '',
      variants: product.variants || null,
    };
    if (catDocId) {
      data.category = { documentId: catDocId };
    }

    const result = await createProduct(data);
    if (result) {
      // Publish the product
      await publishProduct(result.documentId);
      created++;
      if (created % 10 === 0) console.log(`  ... ${created}/${products.length}`);
    }
  }

  console.log(`\n✓ Import complete: ${created} products, ${catMap.size} categories`);
}

main().catch(console.error);
