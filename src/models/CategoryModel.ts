import mongoose from 'mongoose';

interface ICategory {
  name: string;
}
const categorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    unique: true,
  },
});
const Category = mongoose.model<ICategory>('Category', categorySchema);
export default Category;
