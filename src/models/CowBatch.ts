import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICowBatch extends Document {
  _id: mongoose.Types.ObjectId;
  batchName: string;
  purchaseDate: Date;
  buyingCost: number;
  foodCost: number;
  butcherCost: number;
  transportCost: number;
  otherExpenses: number;
  baseMeatPricePerKg: number;
  totalMeatKg: number;
  chamraPrice: number;
  vuriPrice: number;
  paPrice: number;
  status: "active" | "completed";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CowBatchSchema = new Schema<ICowBatch>(
  {
    batchName: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
    },
    buyingCost: {
      type: Number,
      required: [true, "Buying cost is required"],
      min: 0,
    },
    foodCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    butcherCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    transportCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },
    baseMeatPricePerKg: {
      type: Number,
      required: [true, "Base meat price per kg is required"],
      min: 0,
    },
    totalMeatKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    chamraPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    vuriPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    paPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const CowBatch: Model<ICowBatch> =
  mongoose.models.CowBatch || mongoose.model<ICowBatch>("CowBatch", CowBatchSchema);

export default CowBatch;
