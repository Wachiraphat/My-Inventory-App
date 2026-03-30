import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const app = new Elysia();

// ฟังก์ชันช่วยสร้าง HTML Card สำหรับสินค้าแต่ละชิ้น
const renderProductCard = (p: any) => `
  <div id="product-${p.id}" class="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-lg font-bold text-gray-800">${p.name}</h3>
        <p class="text-xs text-gray-400 font-mono mt-1">ID: ${p.id}</p>
        <div class="flex gap-2 mt-2">
            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">SKU: ${p.sku}</span>
            <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Zone: ${p.zone}</span>
        </div>
      </div>
      <button hx-delete="/inventory/${p.id}" hx-target="#product-${p.id}" hx-swap="outerHTML" class="text-red-400 hover:text-red-600 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    </div>
    
    <div class="mt-6 flex items-center justify-between border-t pt-4">
      <div class="flex flex-col">
        <span class="text-xs text-gray-400 uppercase font-semibold">In Stock</span>
        <span class="text-2xl font-black text-gray-900">${p.quantity}</span>
      </div>
      <div class="flex gap-2">
        <button hx-patch="/inventory/${p.id}/adjust" hx-vals='{"change": -1}' hx-target="#product-${p.id}" hx-swap="outerHTML" class="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-bold">-</button>
        <button hx-patch="/inventory/${p.id}/adjust" hx-vals='{"change": 1}' hx-target="#product-${p.id}" hx-swap="outerHTML" class="w-10 h-10 flex items-center justify-center bg-gray-900 hover:bg-black text-white rounded-lg text-xl font-bold">+</button>
      </div>
    </div>
  </div>
`;

// --- ROUTE สำหรับหน้าเว็บหลัก ---
app.get('/', async ({ set }) => {
  const products = await db.product.findMany({ orderBy: { name: 'asc' } });
  
  // กำหนดให้ตอบกลับเป็น HTML
  set.headers['content-type'] = 'text/html; charset=utf8';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Inventory Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
  </head>
  <body class="bg-gray-100 min-h-screen">
    <div class="max-w-5xl mx-auto py-12 px-4">
      <header class="flex justify-between items-center mb-10">
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">Inventory<span class="text-blue-600">.</span></h1>
        <div class="text-sm bg-white px-4 py-2 rounded-full shadow-sm border text-gray-500">
          Bun + Elysia + Prisma
        </div>
      </header>

      <section class="bg-white rounded-2xl p-8 shadow-sm border mb-10">
        <h2 class="text-xl font-bold mb-6">Add New Product</h2>
        <form hx-post="/inventory" hx-target="#inventory-grid" hx-swap="afterbegin" hx-on::after-request="this.reset()" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" name="name" placeholder="Product Name" required class="bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none">
          <input type="text" name="sku" placeholder="SKU Code" required class="bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none">
          <input type="text" name="zone" placeholder="Zone (e.g. A1)" required class="bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none">
          <input type="number" name="quantity" placeholder="Qty" value="0" class="bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none">
          <button type="submit" class="md:col-span-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200">Create Product</button>
        </form>
      </section>

      <div id="inventory-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${products.map(p => renderProductCard(p)).join('')}
      </div>
    </div>

    <script>
      // จัดการ Error เวลาลบสินค้าที่ยังมีของอยู่ (Lab 4)
      document.body.addEventListener('htmx:afterOnLoad', function(evt) {
        if (evt.detail.xhr.status === 400) {
          alert("❌ " + evt.detail.xhr.responseText);
        }
      });
    </script>
  </body>
  </html>
  `;
});

// --- API ROUTES (รองรับทั้ง JSON และ HTML สำหรับ HTMX) ---

app.post('/inventory', async ({ body }) => {
  const product = await db.product.create({ data: body });
  return renderProductCard(product);
}, {
  body: t.Object({
    name: t.String(),
    sku: t.String(),
    zone: t.String(),
    quantity: t.Numeric()
  })
});

app.patch('/inventory/:id/adjust', async ({ params, body }) => {
  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) return "Not Found";
  
  const newQty = product.quantity + body.change;
  if (newQty < 0) return renderProductCard(product); // ไม่ให้ติดลบ

  const updated = await db.product.update({
    where: { id: params.id },
    data: { quantity: newQty }
  });
  return renderProductCard(updated);
}, {
  body: t.Object({ change: t.Numeric() })
});

app.delete('/inventory/:id', async ({ params, set }) => {
  const product = await db.product.findUnique({ where: { id: params.id } });
  if (product && product.quantity > 0) {
    set.status = 400;
    return "ไม่สามารถลบสินค้าที่ยังมีอยู่ในสต็อกได้";
  }
  await db.product.delete({ where: { id: params.id } });
  return ""; 
});

app.listen(3000);
console.log("🚀 Server is ready at http://localhost:3000");