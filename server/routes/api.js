const express = require('express');
const router = express.Router();
var querystring= require('querystring');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var Client = require('ftp');
var csv = require('fast-csv');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var _ = require('lodash-node');
var config ={};



if (process.env.liveenv)
{
  console.log('livesettings');
  var config = require('../../settingsLive');}


else{
  console.log('Local Envoirment');
  var config = require('../../settings');}


var crypto = require('crypto');

var admin = require("firebase-admin");

var serviceAccount = require("../../activehound-eec34-firebase-adminsdk-26k3g-538e1054d6.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://activehound-eec34.firebaseio.com"
});
// Setup
const db = admin.database();

var knex ={};



const Shopify = require('shopify-api-node');
var shopify = '';
var currentShop='';
let userSettings={};
// // Connect
// const connection = (closure) => {
//
//
//   return MongoClient.connect('mongodb://localhost:27017/mean', (err, db) => {
//     if (err) return console.log(err);
//
//   closure(db);
// });
// };


// Error handling
const sendError = (err, res) => {
  response.status = 501;
  response.message = typeof err == 'object' ? err.message : err;
  res.status(501).json(response);
};

// Response handling
let response = {
  status: 200,
  data: [],
  message: null
};
Array.prototype.forEachLoop=function(a){
  var l=this.length;
  for(var i=0;i<l;i++)a(this[i],i)
}
// Get users
router.get('/getProducts',verifyShop, (req, res) => {

    shopify.product.list({ limit: 5 })
    .then(function(products){
      res.setHeader('Content-Type', 'application/json');
      res.send(products)
    })
  .catch(err => console.error(err));

});
router.get('/createProduct',verifyShop, (req, res) => {

    shopify.product.create({  "title": "Pennymore Donation",
      "body_html": "",
      "vendor": "Donations",
      "product_type": "Donations",
      "images": [
        {
          "src": "https://pennymore.herokuapp.com/assets/essentials/logo.png"
        }
      ],
      "variants": [
      {
      "option1": "education-teach-for-america",
      "option2": "1.00",
      "price": "1.00"

      },
      {
      "option1": "education-teach-for-america",
      "option2": "12.00",
      "price": "12.00"
      }
      ]
      ,
      "options": [
        {"name": "cause" },
        {"name":"DonationValue","values":[1,2,3,4]}
      ],
      "published": true })
    .then(function(product){
      console.log(product);
      res.setHeader('Content-Type', 'application/json');



    })
  .catch(function(err){

   //.log(err);


  });

});
router.get('/createVariant',verifyShop, (req, res) => {
  console.log('started variant');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");
    if(req.query.charityid&&req.query.price)
    {


    }


  //return res.send('wow');


});


router.get('/access_token', verifyRequest, function(req, res) {
  if (req.query.shop) {
    var params = {
      client_id: config.oauth.api_key,
      client_secret: config.oauth.client_secret,
      code: req.query.code
    }


    var req_body = querystring.stringify(params);

    console.log(req_body)
    request({
        url: 'https://' + req.query.shop + '/admin/oauth/access_token',
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(req_body)
        },
        body: req_body
      },
      function(err,resp,body) {
        console.log(body);
        body = JSON.parse(body);

        InsertupdateAccessToken(req.query.shop,body.access_token);





        res.redirect('/dashboard?shop='+req.query.shop);
      })
  }
});



router.get('/shopify_auth', function(req, res) {
  if (req.query.shop) {

   console.log(req.query.shop);
   var redirectUri= "https://"+req.query.shop+"/admin/oauth/authorize?client_id="+config.oauth.api_key+"&scope="+config.oauth.scope+"&redirect_uri="+config.oauth.redirect_uri;


    res.redirect(redirectUri);





  }
  else{
  res.send('provide shopify url');

  }
});

router.post('/uninstalled-app',verifyShopifyHook, (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  let Output=async( ()=>{
    console.log('hook happened');
    let capturedorder=false;

    let cShop= req.headers['x-shopify-shop-domain'];


    console.log('app uninstalled');

  });



  Output().then((r)=>{
    res.send({'response':'app uninstalled'});
  });
















});



router.get('/get-firebase-init',(req,res)=>{

    let word= 'Hello';
    db.ref(`shopify/mainstore`).set({word});
    console.log('s- happend');


    db.ref(`shopify/mainstore`).once('value')
        .then( snapshot => {
            console.log(snapshot.val());
            res.send(snapshot.val());
        });


  //  res.send('ok');




});


router.get('/update-stock-from-csv',async ((req,res)=>{

reallyUpdateStock();
res.send('updated');

}));



router.get('/sync-variant-stock',async ((req,res)=>{


        if(req.query.auto)
        {
            let settings= await( db.ref(`shopify/storesettings`).once('value'));
             settings= settings.val();
            if(settings.enabled==true)
            {

                console.log('doing it automatically');

            }
            else
            {
                console.log('cannot do anything');
                res.send('not enabled');
                return;
            }
        }


    let outOfStock= await (getCsvFromFtp());
    res.send('ok');
    let store= await(   db.ref(`shopify/mainstore`).once('value'));
    console.log(store.val());
    store=store.val();
    currentShop=store.store_name;
    shopify = new Shopify({
        shopName: currentShop.replace('.myshopify.com',''),
        apiKey: config.oauth.api_key,
        password: store.access_token,autoLimit:true
    });

    let products= await(shopify.product.list({ limit: 250 }));
    let ShouldSyncStatus = await(db.ref(`shopify/ProductsStatus`).once('value'));
    let ShouldVariantSyncStatus = await(db.ref(`shopify/VariantStatus`).once('value'));
    ShouldSyncStatus=ShouldSyncStatus.val();
    ShouldVariantSyncStatus=ShouldVariantSyncStatus.val();



    let OutOfStockVairants=[];
    let index=products.length;
    products.forEach((p)=>{

        if(ShouldSyncStatus[p.id]==true){
            console.log('can sync');
            p.variants.forEach(variant=>{


                if(ShouldVariantSyncStatus[variant.id]) {
                if (ShouldVariantSyncStatus[variant.id].status == true) {

                let result = _.find(outOfStock, {"sku": variant.sku});


                if (result) {


                if (result.stockvalue >= 10) {
                inventoryPolicy = 'continue';
                console.log(`updating stock for variant ${variant.id}`);

                console.log(variant.id, result.stockvalue);

                shopify.productVariant.update(variant.id, {
                inventory_quantity: result.stockvalue,
                inventory_policy: 'continue'
                }).then(x => {
                console.log(variant.id + '- done');
                });
                console.log(`update stock for variant ${variant.id}`);
                }
                else {

                inventoryPolicy = 'deny';

                await(shopify.productVariant.update(variant.id, {
                inventory_quantity: 0,
                inventory_policy: 'deny'
                }));
                console.log(`update stock for variant ${variant.id}`);
                }


                }
                else {
                console.log('product not found');
                }
                }
                else if (ShouldVariantSyncStatus[variant.id].status == false) {

                console.log('this variant sync is disabled');

                }
                }
                else{
                console.log('variant not configured');
                }



            });

            console.log('remaining '+ index);
        }
        else if (ShouldSyncStatus[p.id]==false){
            console.log('disabled sync');
        }


        else{
            console.log('cannot sync');
        }

        index--;
        if(index==0)
        {

            reallyUpdateStock();
            console.log('updating stock');
        }

    });



}));






router.get('/update-stock-status',async ((req,res)=>{
    //   res.send(outOfStock);
    let store= await(   db.ref(`shopify/mainstore`).once('value'));
    store=store.val();
    currentShop=store.store_name;
    shopify = new Shopify({
        shopName: currentShop.replace('.myshopify.com',''),
        apiKey:   config.oauth.api_key,
        password: store.access_token
    });

    if(req.query.variantId&&req.query.stock) {

        if(stock>=10)
        {
            inventoryPolicy='continue';
        }
        else
        {

            inventoryPolicy='deny';
        }

        let v= await (shopify.productVariant.update(req.query.variantId,{
            inventory_quantity:req.query.stock
        }));
        res.send('ok');
    }


}));





router.get('/get-product-status',async ((req,res)=>{


    if(req.query.productId) {
        let product = await(db.ref(`shopify/ProductsStatus/${req.query.productId}`).once('value'));


        res.send(product);
    }


}));

router.get('/set-product-status',async ((req,res)=>{


    if(req.query.productId && req.query.status) {

        let product = {};
        product[req.query.productId]=req.query.status;

        db.ref(`shopify/ProductsStatus/${req.query.productId}`).set(req.query.status);

        let Rproduct = await(db.ref(`shopify/ProductsStatus/${req.query.productId}`).once('value'));


        res.send(Rproduct);
    }


}));





let getCsvFromFtp =()=>{
    return new Promise((resolve)=>    {

//ftp credentials, evetually we will extract this from a //DB of some sort
        var hostName = "217.8.252.84";
        var userName = "pedigreemid";
        var password = "PedMid3";
        var fileName = 'MIDLANDS.csv';

// Here lies the meat and potatoes of the application
        var c = new Client();
        let serverStock=[];
        c.on('ready', ()=> {
            c.get(fileName, (err, stream)=> {
                if (err) throw err;
                stream.once('close', ()=> { c.end(); });
                csv.fromStream(stream,  {headers: true})
                    .on("data", (data)=>{


                        let datavals= _.values(data);
                        //console.log(datavals[1]);
                        if(parseInt(datavals[0]))
                        {//console.log(data);
                            serverStock.push({'sku':datavals[1],"stockvalue":datavals[0]});
                        }


                    })
                    .on("end", ()=>{
                        console.log("done");
                        resolve(serverStock);
                    });
            });
        });
        c.connect({host:hostName,
            user: userName,
            password:password
        });

    });
}
let reallyUpdateStock= ()=>{


    let outOfStock= await (getCsvFromFtp());
    //   res.send(outOfStock);
    let store= await(   db.ref(`shopify/mainstore`).once('value'));
    console.log(store.val());
    store=store.val();
    currentShop=store.store_name;
    shopify = new Shopify({
        shopName: currentShop.replace('.myshopify.com',''),
        apiKey: config.oauth.api_key,
        password: store.access_token
    });

    let products= await(shopify.product.list({ limit: 250 }));

    let OutOfStockVairants=[];
    products.forEach((p)=>{

        p.variants.forEach(variant=>{


            let result=  _.find(outOfStock, { "sku": variant.sku });
            console.log(result);

            if(result)
            {
                OutOfStockVairants.push({'variantId': variant.id,
                    'title': variant.title,
                    'productName': p.title,
                    'productId': p.id,
                    'sku':result.sku,
                    'stock':result.stockvalue,
                    'currentstock':variant.inventory_quantity

                });

            }

        });

    })

    console.log(OutOfStockVairants);
    let firebaseProducts= [];



    OutOfStockVairants.forEach(x=>{

        if(firebaseProducts[x.productId])
        {
            firebaseProducts[x.productId].push(x);
        }else{
            firebaseProducts[x.productId]=[];
            firebaseProducts[x.productId].push(x);
        }


    })





    db.ref(`shopify/OutOfStockProducts`).set(firebaseProducts);

  return OutOfStockVairants;




}
function InsertupdateAccessToken(shop,accessToken){



 let data= {};
     data.store_name=shop;
     data.access_token=accessToken;


    db.ref(`shopify/mainstore`).set(data);
    console.log('token updated');

}
function createProductifnotexist(shop){




}

function verifyRequest(req, res, next) {
  var map = JSON.parse(JSON.stringify(req.query));
  delete map['signature'];
  delete map['hmac'];

  var message = querystring.stringify(map);
  var generated_hash = crypto.createHmac('sha256', config.oauth.client_secret).update(message).digest('hex');
  console.log(generated_hash);
  console.log(req.query.hmac);
  if (generated_hash === req.query.hmac) {
    next();
  } else {
    return res.json(400);
  }

}
function verifyShop(req,res,next){
  if(req.query.shop)
  {

    if(req.query.shop=='all')
    {
      res.send('not possible');
    }









  }
  else
    return res.json(400);
}
function verifyShopCharge(req,res,next){
  if(req.query.shop)
  {





  }
  else
    return res.json(400);
}
function verifyShopifyHook(req,res,next) {

  console.log(req.headers);

    next();
}


module.exports = router;
