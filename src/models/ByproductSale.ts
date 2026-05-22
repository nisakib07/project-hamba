import mongoose, { Schema, Document, Model } from "mongoose";

export interface IByproductSale extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  itemType: "chamra" | "vuri" | "pa" | "other";
  quantity: number;
  price: number;
  total: number;
  buyerName: string;
  paidAmount: number;
  dueAmount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ByproductSaleSchema = new Schema<IByproductSale>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "CowBatch",
      required: [true, "Batch ID is required"],
      index: true,
    },
    itemType: {
      type: String,
      enum: ["chamra", "vuri", "pa", "other"],
      required: [true, "Item type is required"],
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    buyerName: {
      type: String,
      default: "",
      trim: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for customer/buyer lookups
ByproductSaleSchema.index({ buyerName: 1, batchId: 1 });

// Pre-save middleware to calculate total and due
ByproductSaleSchema.pre("save", function () {
  this.total = this.quantity * this.price;
  this.dueAmount = this.total - this.paidAmount;
});

const ByproductSale: Model<IByproductSale> =
  mongoose.models.ByproductSale ||
  mongoose.model<IByproductSale>("ByproductSale", ByproductSaleSchema);

export default ByproductSale;
