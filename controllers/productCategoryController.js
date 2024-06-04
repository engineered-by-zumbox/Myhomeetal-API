const ProductCategory = require('../models/ProductCategory');

const productCategoryController = {
    createProductCategory: async (req, res) => {
        try {
            const {name} = req.body;

            //Check if a category already exist with the same name
            const existingProductCategory = await ProductCategory.findOne({ name });

            if(existingProductCategory){
                return res.status(400).json({error: 'A product category with this name already exixts'})
            }
            
            //If the category doesn't already exist, create a new one
            const newProductCategory = new ProductCategory({ name });
            await newProductCategory.save();

            res.json({message: 'Product category successfully created'})
        } catch (error) {
            return res.status(500).json({error: 'Ooops!! an error occured, please refresh'})
        }
    },
    
    editProductCategory: async (req, res) => {
        try {
            const productCategoryId = req.params.id;
            const {name} = req.body;

            const existingProductCategory = await ProductCategory.findOne({name});

            if(existingProductCategory && existingProductCategory._id.toString() !== productCategoryId){
                return res.status(400).json({error: 'A product category with this name already exists.'})
            }

            const updatedProductCategory = await ProductCategory.findByIdAndUpdate(
                productCategoryId,
                {name},
                {new: true}
            );
            if (!updatedProductCategory) {
                return res.status(404).json({error: 'Product Category not found'})
            }
            res.json({message: 'Product category updated'})
        } catch (error) {
            res.status(500).json({error: 'Ooops!! an error occured, please refresh'})
        }
    },
    deleteProductCategory: async (req, res) => {
        try {
            const productCategoryId = req.params.id;

            const deletedProductCategory = await ProductCategory.findByIdAndDelete(productCategoryId);

            if(!deletedProductCategory){
                return res.status(404).json({error: 'Product Category not found'})
            }
            res.json({message: 'Product Category deleted'})
        } catch (error) {
            return res.status(500).json({error: 'Ooops!! an error occured, please refresh'})
        }
    }
}
module.exports = productCategoryController;