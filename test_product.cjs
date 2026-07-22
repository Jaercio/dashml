class Product {
  constructor(id, name, sku, internalCode, mlCode, category, supplierId, brand, purchasePrice, sellingPrice, minPrice, idealPrice, weight, dimensions, stock, physicalLocation, imageUrl, barcode, isActive, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.sku = sku;
    this.internalCode = internalCode;
    this.mlCode = mlCode;
    this.category = category;
    this.supplierId = supplierId;
    this.brand = brand;
    this.purchasePrice = purchasePrice;
    this.sellingPrice = sellingPrice;
    this.minPrice = minPrice;
    this.idealPrice = idealPrice;
    this.weight = weight;
    this.dimensions = dimensions;
    this.stock = stock;
    this.physicalLocation = physicalLocation;
    this.imageUrl = imageUrl;
    this.barcode = barcode;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
const p = new Product("1","Test","SKU1",null,null,null,null,null,0,10,0,0,0,null,5,null,null,null,true,new Date(),"2024-01-01");
const json = JSON.parse(JSON.stringify(p));
console.log("Serialized:", JSON.stringify(json));
console.log("isActive:", json.isActive);
