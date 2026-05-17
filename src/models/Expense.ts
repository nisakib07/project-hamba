import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  expenseType: "food" | "butcher" | "transport" | "medicine" | "other";
  amount: number;
  note: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "CowBatch",
      required: [true, "Batch ID is required"],
      index: true,
    },
    expenseType: {
      type: String,
      enum: ["food", "butcher", "transport", "medicine", "other"],
      required: [true, "Expense type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    note: {
      type: String,
      default: "",
      trim: true,
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

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
