import { useEffect } from "react";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { useState } from "react";

import productStyle from "../styles/productList.css?url"

export function links() {
  return[{rel:"stylesheet",href:productStyle,}]
}


const productList = {
  "products": [
    {
      "title": "Wireless Headphones",
      "image_url": "https://rukminim2.flixcart.com/image/832/832/k7285u80/headphone/4/3/u/boat-rockerz-370-original-imafpdzhywghfabu.jpeg?q=70&crop=false",
      "description": "Noise-cancelling wireless headphones with 20-hour battery life."
    },
    {
      "title": "Smart Watch",
      "image_url": "https://rukminim2.flixcart.com/image/832/832/xif0q/smartwatch/o/l/h/-original-imagghz3bxh5cmab.jpeg?q=70&crop=false",
      "description": "Track your fitness and receive notifications with this stylish smart watch."
    },
    {
      "title": "4K Ultra HD TV",
      "image_url": "https://images.samsung.com/is/image/samsung/p6pim/in/ua43due70bklxl/gallery/in-crystal-uhd-du7000-499586-ua43due70bklxl-540344867?$720_576_PNG$",
      "description": "Experience stunning visuals with our latest 4K Ultra HD TV."
    },
    {
      "title": "Bluetooth Speaker",
      "image_url": "https://www.artis.in/cdn/shop/products/1_f5b3377c-c870-420f-bc6a-5cd4b3a5a7c7.jpg?v=1653639993",
      "description": "Portable Bluetooth speaker with powerful sound and deep bass."
    },
    {
      "title": "Gaming Laptop",
      "image_url": "https://i.pcmag.com/imagery/roundups/01hiB08j7yaJGJmPl2YhRRH-59..v1713199550.jpg",
      "description": "High-performance gaming laptop with the latest graphics card."
    },
    {
      "title": "Coffee Maker",
      "image_url": "https://www.ikea.com/in/en/images/products/upphetta-coffee-tea-maker-glass-stainless-steel__0711267_pe728105_s5.jpg?f=xl",
      "description": "Brew your perfect cup of coffee with our programmable coffee maker."
    },
    {
      "title": "Portable Charger",
      "image_url": "https://images.unsplash.com/photo-1619489646924-b4fce76b1db5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9ydGFibGUlMjBjaGFyZ2VyfGVufDB8fDB8fHww",
      "description": "Compact portable charger with fast charging capabilities."
    },
    {
      "title": "Fitness Tracker",
      "image_url": "https://www.fitbit.com/global/content/dam/fitbit/global/pdp/devices/inspire2/herostatic/black/proxima-black-device-3qt.png",
      "description": "Monitor your health and activity levels with this sleek fitness tracker."
    },
    {
      "title": "Electric Toothbrush",
      "image_url": "https://mytusk.in/cdn/shop/files/green_brushh.jpg?v=1718462312&width=1400",
      "description": "Achieve a deeper clean with our advanced electric toothbrush."
    },
    {
      "title": "Home Security Camera",
      "image_url": "https://assets.airtel.in/static-assets/b2c-surveillance/images/product-details/activeDefence/activeDefence-product1.png",
      "description": "Stay safe with our easy-to-install home security camera."
    }
  ]
}



export const loader = async ({ request }) => {
  const {session} = await authenticate.admin(request);
  return json({productList,shop:session.shop});
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  console.log(session.shop);

  let body = await request.formData();
  body = Object.fromEntries(body.entries())

  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: body.title,
        },
      },
    },
  );


  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;


  await admin.graphql(
    `#graphql
    mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
      productCreateMedia(media: $media, productId: $productId) {
        media {
          alt
          mediaContentType
          status
        }
        mediaUserErrors {
          field
          message
        }
        product {
          id
          title
        }
      }
    }`,
    {
      variables: {
        "media": [
          {
            "alt": "Image",
            "mediaContentType": "IMAGE",
            "originalSource": body.image_url
          }
        ],
        "productId": product.id
      },
    },
  );


  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return json({
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  });
};

export default function Index() {
  const fetcher = useFetcher();
  const productData = useLoaderData();

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );


  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (productId) {
      setShowNotification(true)
    }
  }, [productId]);

  const pushProduct = (e)=>{
    console.log(e.target.dataset['id']);
    const id = e.target.dataset['id']
    const product = productData.productList.products[id]
    console.log(product);
     fetcher.submit(product, { method: "POST" })
  }

  return (
    <div>
      {     
        showNotification ? (<div className="pop-up-container">
          <a target="_blank" href={`https://${productData.shop}/products/${fetcher.data?.product?.handle}`}>{fetcher.data?.product?.handle}</a>
        </div>) : ""
      }
       <div id="products-cards-container" className="page-width">  
        {productData.productList.products.map((product,index) => (  
          <div key={index} className="product-card"> 
            <img className="product-image" src={product.image_url} alt="" height="200" width="200" /> 
            <p className="product-title">{product.title}</p>  
            <button data-id={index} className="Push product" onClick={pushProduct}>
              Push product
            </button>
          </div>  
        ))}  
    </div>  
    </div>
  );
}
