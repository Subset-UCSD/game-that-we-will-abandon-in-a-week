// this is not optimized 
// we should deduplicate textures somehow

import { ItemId, Player } from "@common";
import { Canvas } from "./canvas";

type Entry = [ItemId, {image:ImageBitmap,lore:string[]}]
const itemTextures = new Map(await Promise.all([
  fetch("./assets/what-do-sheep-become-when-they-die1.png")
				.then((r) => r.blob())
				.then(createImageBitmap).then((image):Entry => ['cloud',{image,lore:[
'CLOUD 雲',
'when sheep die',
'process known as',
'condensation',
        ]}]),
  fetch("./assets/dager.png")
				.then((r) => r.blob())
				.then(createImageBitmap).then((image):Entry => ['knife',{image,lore:[
'KNIFE 刀',
'convenient to use',
'was $0.97 on temu',
'hold K to use',
        ]}]),
  fetch("./assets/meatball1.png")
				.then((r) => r.blob())
				.then(createImageBitmap).then((image):Entry => ['meatball',{image,lore:[
'MEAT BALL',
'scrumptious',
'off brand ikea ball',
'these ones spicy',
        ]}]),
  fetch("./assets/seed1.png")
				.then((r) => r.blob())
				.then(createImageBitmap).then((image):Entry => ['seed',{image,lore:[
'SEEDLING',
// 'impregnate the',
// 'world with your seed',
'this grass eater',
'makes seed',
'press F to plant',
        ]}]),
  fetch("./assets/turnip.png")
				.then((r) => r.blob())
				.then(createImageBitmap).then((image):Entry => ['turnip',{image,lore:[
'CARROT 蘿蔔',
// 'impregnate the',
// 'world with your seed',
'good for eye',
'pointy',
'looks like enimy',
        ]}]),
]))

const GAP = 20
const ITEM_SIZE = 40
const IMG_EXPAND = 10

export function renderInventory ({c}:Canvas ,items: Player['items']) : void {
  c.strokeStyle ='black'
  c.fillStyle = 'black'
  for (const [i, {item,count}] of items.entries()) {
    const x = GAP + (ITEM_SIZE + GAP)*i
    c.strokeRect(x, GAP, ITEM_SIZE, ITEM_SIZE)
    const entry = itemTextures.get(item)
    if (entry){
      const{ image, lore}=entry
      if (count > 5) {
         c.drawImage(image,
      x-IMG_EXPAND + 6,GAP-IMG_EXPAND + 6,ITEM_SIZE+2*IMG_EXPAND,ITEM_SIZE+2*IMG_EXPAND)
      }
      if (count > 1) {
         c.drawImage(image,
      x-IMG_EXPAND + 3,GAP-IMG_EXPAND + 3,ITEM_SIZE+2*IMG_EXPAND,ITEM_SIZE+2*IMG_EXPAND)
      }
    c.drawImage(image,
      x-IMG_EXPAND,GAP-IMG_EXPAND,ITEM_SIZE+2*IMG_EXPAND,ITEM_SIZE+2*IMG_EXPAND)


      for (const [j, line] of lore.entries()) {
        
        c.fillText(line, x , GAP + ITEM_SIZE + (j +1)*20,ITEM_SIZE)
      }
    }

      if (count>1) {
        c.fillText(`${count}`, x + ITEM_SIZE, GAP + ITEM_SIZE + 5)
      }
  }
}
