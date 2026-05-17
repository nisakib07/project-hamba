import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMeatSale extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  customerName: string;
  kgQuantity: number;
  pricePerKg: number;
  totalPrice: number;
  paidAmount: number;
  dueAmount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MeatSaleSchema = new Schema<IMeatSale>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "CowBatch",
      required: [true, "Batch ID is required"],
      index: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    kgQuantity: {
      type: Number,
      required: [true, "Quantity in kg is required"],
      min: [0.01, "Quantity must be greater than 0"],
    },
    pricePerKg: {
      type: Number,
      required: [true, "Price per kg is required"],
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
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

// Pre-save middleware to calculate totalPrice and dueAmount
MeatSaleSchema.pre("save", function () {
  this.totalPrice = this.kgQuantity * this.pricePerKg;
  this.dueAmount = this.totalPrice - this.paidAmount;
});

const MeatSale: Model<IMeatSale> =
  mongoose.models.MeatSale || mongoose.model<IMeatSale>("MeatSale", MeatSaleSchema);

export default MeatSale;
