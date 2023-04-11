const express =  require("express");
const mongoose = require('mongoose');

const app =  express();
const PORT =  3002;

app.use(express.json());
app.use(express.urlencoded({extended : true}));

// create product schema
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Product title is required"],
        minlength: [3, "minimum lengthe of the product title should be 3"],
        maxlength: [255, "maximum lengthe of the product title should be 255"],
        lowercase: true,
        // uppercase: true
        trim: true,
        // enum:{
        //     values: ["iphone", "samsung"],
        //     message: "{VALUE} is not supported",
        // },
        // validate: {
        //     validator: function (v) {
        //         return v.length ===10;
        //     },
        //     message: (props) => `${props.value} is not a valid title`,
        // },
    },
    price: {
        type: Number,
        min: [20, "minimum price of the product should be 200"],
        max: [2000, "maximum price of the product should be 2000"],
        required: true
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        validate: {
            validator : function (v) {
                const phoneRegex = /\d{3}-\d{3}-\d{4}/;
                return phoneRegex.test(v);
            },
            message: (props) => `${ props.value } is not a valid phone number`,
        },
    },
    rating: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        unique: true,
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//create model
const Product = mongoose.model('Products', productSchema);

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/testProdctDB');
        console.log('Database is connected');
    } catch (error) {
        console.log('Database is not connected');
        console.log(error);
        process.exit(1);
    }
}

// mongoose
// .connect('mongodb://127.0.0.1:27017/testProdctDB')
// .then(() => console.log("database is connected"))
// .catch((error) => {
//     console.log("database is not connected");
//     console.log(error);
//     process.exit(1);
// });


app.listen(PORT, async () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    await connectDB();
});


app.get('/', (req, res) => {
    res.send('Welcome to the homepage');
});

// create product
app.post('/products', async (req, res) => {
    try {

        const newProduct =  new Product({
            title : req.body.title,
            price :  req.body.price,
            rating :  req.body.rating,
            phone : req.body.phone,
            description : req.body.description
        });
        const productData = await newProduct.save();

        // const productData =  await Product.insertMany([
        //     {
        //         title: "Opp A9",
        //         price: 21000,
        //         description: "RAM: 8GB, ROM: 128"
        //     },
        //     {
        //         title: "Opp A9 2020",
        //         price: 21500,
        //         description: "RAM: 4GB, ROM: 128"
        //     },
        //     {
        //         title: "Opp A6",
        //         price: 24000,
        //         description: "RAM: 8GB, ROM: 128"
        //     },
        //     {
        //         title: "Opp A50",
        //         price: 22000,
        //         description: "RAM: GB, ROM: 64"
        //     }
        // ])

        res.status(202).send(productData)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// read all product
app.get('/products', async (req, res) => {
    try {
        const price = req.query.price;
        const rating = req.query.rating;
        let products;
        if(price && rating){
            // { $or [{ price: { $gt: price }}, {rating: {$gt: 4} }]}
            // const products = await Product.find({price: {$eq: 22000}});
            // products = await Product.find({price: {$gt: price}});
            // products = await Product.find({ 
            //     $or: [{ price: { $gt: price }}, {rating: {$gt: rating} }]
            // });
            products = await Product.find({ 
                $or: [{ price: { $gt: price }}, {rating: {$gt: rating} }]
            }).countDocuments();

        }
        else{
            // const products = await Product.find().limit(2);
            // products = await Product.find();
            // products = await Product.find().countDocuments();
            products = await Product.find().sort({price: -1});
        }


        if(products){
            res.status(200).send({
                success: true,
                message: "return all product",
                data:  products 
            });
        }
        else{
            res.status(404).send({
                success: false,
                message: "Products not found",
            });
        }
    } catch (error) {
        res.status(500).send({message: error.message});
    }
});

// read single product
app.get('/products/:id', async (req, res) => {
    try {
        const id = req.params.id
        // const product = await Product.find({_id: id});      //return in object
        const product = await Product.findOne({_id: id});       //return in array
        // const product = await Product.findOne({_id: id}).select
        // ({
        //     title: 1,
        //     price: 1,
        //     _id: 0
        // });       //select specific data
        // res.send(product);
        if(product){
            res.status(200).send({
                success: true,
                message: "return a single product",
                data:  product  
            });
        }
        else{
            res.status(404).send({
                success: false,
                message: "Product not found",
            });
        }
    } catch (error) {
        res.status(500).send({message: error.message});
    }
});


// delete product
app.delete('/products/:id', async (req, res) => {
    
    try {
        const id = req.params.id;
        // const product = await Product.deleteOne({_id: id});
        const product = await Product.findByIdAndDelete({_id: id});
        if(product){
            res.status(200).send({
                success: true,
                message: "Deleted single product",
                data: product
            });
        }
        else{
            res.status(404).send({
                success: false,
                message: " Product was not deleted with id"
            });
        }
    } catch (error) {
        res.status(500).send({message: error.message});
    }
});

// update product
app.put('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // const updatedProduct = await Product.updateOne(
        const updatedProduct = await Product.findByIdAndUpdate(
            { _id: id},
            {
                $set: {
                    title: req.body.title,
                    description: req.body.description,
                    price: req.body.price,
                    rating: req.body.rating,
                }
            },
            {new: true}
        );
        if(updatedProduct){
            res.status(200).send({
                success: true,
                message: "updated single product",
                data: updatedProduct,
            })
        }
        else{
            res.status(404).send({
                success: false,
                message: "product was not updated with this id",
            })
        }
    } catch (error) {
        res.status(500).send({message: error.message});
    }
});


// Database -> collections -> document

//POST: /products -> create a product
//GET: /products -> Return all the product
//GET: /products:id -> Return a specific single product
//PUT: /products:id -> Update aa product based on id
//DELETE: /products:id -> delete a product based on id