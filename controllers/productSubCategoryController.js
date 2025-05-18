const productSubCategoryModel = require('../models/ProductSubCategory');
const productCategory = require('../models/ProductCategory');
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const Product = require("../models/Product");
const mongoose = require("mongoose");



const createProductSubCategory = async (req, res) => {
    try {
        const { name, category} = req.body;

        // Check if a subcategory with the same name already exists
        const existingSubCategory = await productSubCategoryModel.findOne({ name });
        if (existingSubCategory) {
            return res.status(400).json({
                message: `Subcategory with name ${name} already exists`,
            });
        }

         let subCategoryImage = null;

        // Handle file upload to Cloudinary
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, 
                    {folder: 'productSubCategories'} 
                );

                subCategoryImage = result.secure_url 
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error('Cloudinary upload error:', error.message);
                return res.status(500).json({ error: 'Failed to upload picture' });
            }
        }

        const data = {
            name,
            subCategoryImage,
            category,
            createdBy: req.admin.email,
            createdOn: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })
        };

        // Create and save the new subcategory
        const subCategory = new productSubCategoryModel(data);
        const newSubCategory = await subCategory.save();

        const productsCategory = await productCategory.findByIdAndUpdate(
            category, 
            {$push: {subCategory: newSubCategory._id}},
            {new: true});
        
        if(!productsCategory) {
            return res.status(404).json({
              message: `Category with ID ${category} not found while adding subcategory.`,
              
            });
        }
        res.status(200).json({
            message: 'Successfully created a new subcategory',
            subCategory: newSubCategory,
        });
    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({
            error: error.message,
            message: 'Server error',
        });
    }
};

const getAllSubCategories = async (req, res) => {
    try {
        const subcategories = await productSubCategoryModel.find()//.populate('category');

        if (!subcategories || subcategories.length === 0) {
            return res.status(404).json({ message: 'No subcategories found.' });
        }

        const subcategoriesWithProducts = await Promise.all(
            subcategories.map(async (subcategory) => {
                const products = await Product.find({
                  subCategory: subcategory._id,
                })
                  .populate("category", "name product_category_image")
                  .populate("subCategory", "name subCategoryImage");

                return {
                    ...subcategory.toObject(),
                    products: products, 
                };
            })
        );
        res.status(200).json({
            message: 'All SubCategory',
            subcategories: subcategoriesWithProducts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
};

const getOneSubCat = async (req, res) => {
    try {
        const subCatId = req.params.id;
        const getSubCat = await productSubCategoryModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(subCatId) }
            },
            { 
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'subCategory',
                    as: 'products'
                }
            },
            // add a project stage to reshape the output if needed
            {
                $project: {
                    _id: 1,
                    name: 1,
                    subCategory: 1,
                    products: 1
                }
            }
        ]);
        if (!getSubCat || getSubCat.length === 0) {
            return res.status(404).json({
                message: `Sub-category not found`
            });
        } else {
            res.status(200).json({
                message: `sub-category ${getSubCat[0].name} found`,
                data: getSubCat[0]
            })
        }
    } catch (error) {
      console.error("server error:", error.message);
      res.status(500).json({
        message: `unable to fetch subcategory`,
      });
    }
}

// const getOneSubCategory = async (req, res) => {
//     try {

//         const subCategoryId = req.params.id;  // get the subCategory id
//         const subCategory = await productSubCategoryModel.findById(subCategoryId).populate('products')

//         if (!subCategory) {
//             return res.status(400).json({
//                 message: `subCategory not available`
//             })
//         } else {
//             res.status(200).json({
//                 message: `subcategory ${subCategory.name} found`, 
//                 data: subCategory                          
//             })
//         }

        
//     } catch (error) {
//         console.error('server error:' , error.message)
//         res.status(500).json({
//             message: `unable to fetch subcategory`
//         })
//     }
// }


const updateSubCategory = async (req, res) => {
    try {

        const subCategoryId = req.params.id;  // get the id of the category to update
        const { name } = req.body;  
        const subCategory = await productSubCategoryModel.findById(subCategoryId)  
        
        // check if the subcategory exists
        if (!subCategory ) {  
            return res.status(404).json({
                message: `selected category not available`
            })
        }
        
        // check if theres a subcategory with chosen name already
        const checkSubCategory = await productSubCategoryModel.findOne({ name }); 
        if (checkSubCategory) {
            return res.status(400).json({
                message: `Sub category with ${name} already exists`
            })
        }

        const updateData = {
            name: subCategory.name,
            subCategoryImage: subCategory.subCategoryImage 
        }

        let newImage = null

        if (req.file) {

            try {
                // check if theres an existing image
                if (updateData.subCategoryImage) {

                // if an image was provided, delete the previous image, by extracting the publicId
                const public_id = updateData.subCategoryImage.split('/').slice(7).join('/').split('.')[0];

                await cloudinary.uploader.destroy(public_id);  // then delete the image
                // console.log(public_id)  // log the public id
                // console.log(deleteImage) // log to know if the image available on the server was deleted
                } 

                // upload the new image
                const result = await cloudinary.uploader.upload(req.file.path, 
                    { folder: "productSubCategories"}
                )
                newImage = result.secure_url
                fs.unlinkSync(req.file.path)  // remove the image from the local storage
               
            } catch (error) {
                console.error("cloudinary upload error: ", error.message)
               return res.status(400).json({message: "unable to upload updated photo"
                })
            }
        }
        
        const Data = {
            name: name || updateData.name,
            subCategoryImage: newImage || updateData.subCategoryImage,
            updatedBy: req.admin.email,
            updatedOn: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })
        }

        // console.log(Data.subCategoryImage)

        const updatedSubCategory = await productSubCategoryModel.findByIdAndUpdate(
            subCategoryId, 
            Data, 
            {new: true})

            res.status(200).json({
            message: 'successfully updated product sub category',
            data: updatedSubCategory
        })
    } catch(error) {
        console.error("error updating category :", error.message)
        res.status(500).json({
            message: "internal error"
        })
    }
}

const deleteSubCategory = async (req, res) => {
    try {

        const subCategoryId = req.params.id;  // get the id to delete

        const subCategory = await productSubCategoryModel.findById(subCategoryId) // check if it's available

        if(!subCategory) {
            return res.status(404).json({
                message: "trying to delete an invalid Subcategory"
            })
        } 

        // check if theres an image for the subcategory 
        if (subCategory.subCategoryImage) {
            try {
                // extract the public id, so the image will be deleted from cloudinary
                const public_id = subCategory.subCategoryImage.split('/').slice(7).join('/').split('.')[0];

                const deleteImage = await cloudinary.uploader.destroy(public_id);  // then delete the image
                // console.log(public_id)  // log the public id
                // console.log(deleteImage) // log to know if the image available on the server was deleted
                
            } catch (error) {
                console.error("error deleting image :", error.message)
                res.status(400).json({
                    message: "image was not deleted, try again"
                })
            }
        }

        await productSubCategoryModel.findByIdAndDelete(subCategoryId); // delete the sub category
        return res.status(200).json({
            message: `successfully deleted sub category ${subCategory.name}`
        })
    } catch (error) {
        console.error("error deleting category :", error.message)
        res.status(500).json({
            message: "internal error"
        })
    }
}


module.exports = { 
    createProductSubCategory, 
    // getProductSubCategory, 
    // getOneSubCategory,
    getOneSubCat,
    updateSubCategory,
    deleteSubCategory,
    getAllSubCategories
}

