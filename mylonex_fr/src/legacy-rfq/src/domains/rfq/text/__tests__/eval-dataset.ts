/**
 * MyloNex RFQ Plain-Text Extraction Evaluation Dataset
 * Total cases: 625
 * Splits: Dev (386), Validation (125), Held-Out (114)
 * Verified deterministic textile evaluation benchmarks.
 */

export type EvalCase = {
  id: string;
  input: string;
  category: string;
  split: "dev" | "validation" | "held_out";
  isProvided110?: boolean;
  expectedCount?: number;
  expected?: {
    blend?: string;
    blendStatus?: "explicit" | "review" | "absent";
    count?: string;
    construction?: string;
    weaveType?: string;
    gsm?: number;
    gsmStatus?: "explicit" | "review" | "absent";
    width?: string;
    widthStatus?: "explicit" | "review" | "absent";
    greigeWidth?: number;
    quantity?: number;
    quantityStatus?: "explicit" | "bound" | "review" | "absent";
    fabricState?: string;
    productionCycle?: string;
    colours?: string[];
    finish?: string;
  };
};

export const EVAL_DATASET: EvalCase[] = [
  {
    "id": "TEST 001",
    "input": "20's P/V (65/35) x 20's P/V (65/35) x 100 x 56 x 63\" Griege width, 2/2 Twill. Quantity would be above 5000m.",
    "category": "complex_yarn_greige",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 002",
    "input": "20’s P/V (65/35) x 20’s P/V (65/35) 100 x 56 x 63” Greige width, 2/2 Twill.",
    "category": "complex_yarn_greige",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 003",
    "input": "80D/72/2 Poly HIM Roto FD White x 2/40's Cotton Combed TFO Knotless / 76 x 52 x 63\" Greige Width, Weave Plain. Order qty: 5000 mtrs.",
    "category": "complex_yarn_greige",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 004",
    "input": "16 OE × 16 OE / 96 × 60, 65” RS, 2/2 Matty (OL), 100% cotton. Need 3000 metres.",
    "category": "shorthand_notation",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 005",
    "input": "20 CCW × 20 CCW / 96 × 48, 3/1 Drill, 100% cotton, 240 GSM, 60-inch finished width, dyed navy. Quantity 5000m.",
    "category": "shorthand_notation",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 006",
    "input": "100% cotton 2/1 twill 30x30 110x60 58\" ready 1000m dyed black.",
    "category": "compact_notation",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 007",
    "input": "40x40-142x72 100% cotton, plain weave, 125gsm, 58\", RFD, 500 M.",
    "category": "compact_notation",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 008",
    "input": "40s × 40s / 133 × 72, 100% cotton, 120 GSM, plain weave, 58-inch finished width, dyed white, 3000m.",
    "category": "compact_notation",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 009",
    "input": "30s*30s—100*72, viscose 100%, twill, 135gsm, 58in, dyed olive, 2.5k m.",
    "category": "compact_notation",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 010",
    "input": "100% cotton\n20 by 16\n108 by 56\nNon lycra\nDyed peach finish\n30k mts - 3 colours\nNeed price n delivery.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 011",
    "input": "Need 30's viscose x 30's viscose, construction 100x72, 135 GSM, 100% viscose, twill weave, dyed black. 2500 metres.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 012",
    "input": "30’s slub x 30’s slub\n96x52\n100% viscose\nPlain weave\n145 GSM\n58 inches finished width\nDyed beige\n1500m",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 013",
    "input": "Warp: 2/40's cotton combed TFO knotless.\nWeft: 2/40's cotton combed TFO knotless.\nEPI/PPI: 76 x 52.\nPlain weave, 63\" greige width.\nQuantity: 5000m.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 014",
    "input": "Warp 150D polyester, weft 150D polyester, construction 100x80, 2/2 twill, 100% polyester, 180gsm, 58\" finished width. Dyed charcoal. Qty 4000 metres.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 015",
    "input": "75D x 75D / 180 x 90, polyester 100%, satin weave, 110gsm, 58 inches, dyed maroon, 2000m.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 016",
    "input": "20/1 cotton x 20/1 cotton / 108x56, 3/1 twill, 240 GSM, 58\", dyed black, 5000 metres. No elastane.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 017",
    "input": "2/30 bamboo-poly yarn x 30s bamboo-poly yarn, 50/50 bamboo viscose and polyester, 200 GSM, twill, 58 inches. Need 3000m. Stretch requirement not finalized.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 018",
    "input": "Warp 40s cotton. Weft 40s cotton + 40D elastane. Plain weave, 160gsm, 58\" finished width. Need 2000m dyed navy. Overall blend percentages to be confirmed.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 019",
    "input": "65/32/3 polyester cotton elastane, 150D x 30s + 40D, 2/1 twill, 200 GSM, 58 inches finished width. 5000m dyed navy.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 020",
    "input": "16 OE by 16 OE, construction 96 by 60, 2/2 Matty, cotton 100%, 65-inch greige width. Please quote for 2500 metres.",
    "category": "yarn_specs",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 021",
    "input": "Need cotton poplin white, 120 gsm, 58 inch, plain, 100% cotton. 500m ready stock milega?",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 022",
    "input": "Hi, looking for 65/35 poly viscose, 2/2 twill, 200 gsm, 58\". Need 3k metres in navy.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 023",
    "input": "Can you arrange 100% cotton 145gsm plain, dyed black, 1000 m? Need urgently from ready stock.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 024",
    "input": "Looking for soft viscose twill, 135 GSM, 58\", 100% viscose. Need 2000m in olive. Send rate and delivery.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 025",
    "input": "Cotton twill chahiye, 200 gsm, 58 inch, navy blue dyed. 100% cotton, no lycra. 3000 meter requirement.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 026",
    "input": "1000m total chahiye. Navy 600m, black 400m. Fabric 65/35 poly cotton, plain, 145gsm, width 58 inch, dyed.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 027",
    "input": "Need fabric for shirts. Cotton dobby, 140 gsm, 58\", dyed light blue, quantity 2500 metres. Cotton percentage not confirmed yet.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 028",
    "input": "Please check stock for 2/1 twill cotton, 180gsm, 58\". Need 1500 meters beige. No peach finish, soft finish only.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 029",
    "input": "Scrub uniform ke liye 200gsm fabric chahiye, poly viscose elastane, 58 inches, dyed navy, 3000m. Blend ratio abhi final nahi hai.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 030",
    "input": "Need RFD cotton poplin. 40s x 40s, 133 x 72, 120gsm, 58 inches. 2500 mts. Dyeing hum karenge.",
    "category": "informal_hindi_english",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 031",
    "input": "Please quote 5000 metres of 100% cotton plain weave, 145 GSM, 58-inch finished width, dyed navy, ready stock.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 032",
    "input": "We require 10,000 metres of 100% cotton 3/1 twill, 240 GSM, 60-inch finished width, reactive dyed in navy and black. Colour split will follow.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 033",
    "input": "Kindly offer 100% viscose fabric, 30s × 30s, construction 100 × 72, 135 GSM, twill weave, dyed black, 3000 metres, made to order.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 034",
    "input": "We are sourcing 92% polyester and 8% elastane woven fabric, 180 GSM, 58-inch finished width, dyed charcoal. Requirement 4000 metres.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 035",
    "input": "Please offer 100% linen plain weave, 140 GSM, 58-inch finished width, RFD. Required quantity 1500 metres. Sample approval is required.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 036",
    "input": "Please quote polyester Oxford, 150D × 150D, construction 80 × 60, 180 GSM, 60 inches, dyed royal blue, 6000 metres.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 037",
    "input": "We require 60% cotton and 40% polyester plain fabric, 130 GSM, 58 inches, dyed white, wrinkle-free finish, 8000 metres from running production.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 038",
    "input": "Kindly offer 100% polyester satin, 110 GSM, 58-inch cuttable width, dyed burgundy, 2000 metres. Quote price per metre and production lead time.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 039",
    "input": "For patient gowns, we need 50% polyester and 50% cotton, plain weave, 140 GSM, 58-inch finished width, dyed blue, 6000 metres.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 040",
    "input": "We require a lab-coat fabric: 65% polyester, 35% cotton, plain weave, 180 GSM, 58 inches, dyed white, 5000 metres. Please provide a sample before bulk approval.",
    "category": "formal_rfq",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 041",
    "input": "Blend: 100% cotton\nCount: 40s x 40s\nConstruction: 133 x 72\nWeave: Plain\nGSM: 120\nWidth: 58 inches finished\nState: RFD\nQuantity: 3000 metres\nProduction cycle: Running production",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 042",
    "input": "Composition = 65% polyester + 35% cotton.\nWeight = 150 g/m².\nWidth = 147.32 cm finished.\nWeave = Plain.\nState = Dyed.\nColour = White.\nOrder = 5000 m.",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 043",
    "input": "Fabric: Cotton poplin | Blend: 100% cotton | GSM: 125 | Width: 58\" | State: Printed | Qty: 2000m | Production: Made to order.",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 044",
    "input": "Yarn count—30s × 30s; fabric construction—100 × 72; blend—100% viscose; weave—2/1 twill; width—58\" finished; GSM—135; qty—3000m; state—dyed.",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 045",
    "input": "QUALITY: COTTON TWILL\nCOMPOSITION: 100% COTTON\nCOUNT: 20S X 16S\nEPI X PPI: 108 X 56\nWEIGHT: 240 GSM\nWIDTH: 58\" FINISHED\nSTATE: DYED\nQTY: 10000 M",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 046",
    "input": "Fabric name: Hospital Classic.\nBlend: 65% polyester, 35% viscose.\nWeave: 2/1 twill.\nGSM: 200.\nWidth: 58 inches finished.\nState: Dyed.\nQuantity: 5000m.\nTarget price: ₹180/metre.",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 047",
    "input": "Fabric state: Greige.\nProduction cycle: Ready stock.\nComposition: 65/35 polyester-viscose.\nCount: 20s × 20s.\nConstruction: 100 × 56.\nWeave: 2/2 twill.\nGreige width: 63\".\nQuantity: 5000 m.",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 048",
    "input": "Need viscose twill.\n30's x 30's.\nConstruction 100 x 72.\nBlend 100% viscose.\n135 GSM.\n58 inch finished width.\nDyed black.\n2000 metres.",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 049",
    "input": "For hotel uniforms:\n100% cotton\n3/1 drill\n240 gsm\n60 inch finished width\n5000m navy\n3000m black\nTotal 8000m",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 050",
    "input": "Composition 55% linen / 45% cotton. Plain weave. 160 GSM. Cuttable width 58 inches. RFD. Quantity required 2500m. Delivery to Mumbai.",
    "category": "structured_kv",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 051",
    "input": "Need 500 (M) of 100% cotton plain fabric, 145 GSM, 58 inches, RFD.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 052",
    "input": "Order quantity: 500(M). Fabric 100% viscose twill, 135gsm, 58-inch finished width, dyed olive.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 053",
    "input": "30K MTS required. Cotton 100%, 20x16 / 108x56, 3/1 twill, 240gsm, 58\", dyed.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 054",
    "input": "Need 1.5k metres of 100% viscose twill, 135 GSM, 58-inch finished width, dyed bottle green.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 055",
    "input": "500m per colour, four colours: navy, black, olive and beige. Total 2000m. Cotton twill, 200gsm, 58 inches, dyed.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 056",
    "input": "We need between 5000 and 7000 metres of 65/35 poly-cotton plain fabric, 145 GSM, dyed white, 58-inch finished width.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 057",
    "input": "Quantity would be above 5000m. 100% cotton, 2/1 twill, 180gsm, 58 inches finished, dyed navy.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 058",
    "input": "Need at least 2000 metres of 100% viscose plain fabric, 120gsm, 58 inches, RFD.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 059",
    "input": "Please quote up to 3000m of polyester Oxford, 180gsm, 60-inch width, dyed black. Final quantity will be confirmed later.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 060",
    "input": "Need 2000 yards of 100% cotton poplin, 120gsm, 58-inch width, dyed white. Quote per yard and preserve the order unit as yards.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 061",
    "input": "Requirement: 500 kg of 100% cotton single jersey, 180 GSM, dyed black. Width and yarn count will be confirmed later.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 062",
    "input": "Need 100 rolls of polyester plain fabric, 150gsm, 58\", dyed white. Each roll 50 metres. Total 5000 metres.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 063",
    "input": "Need 100 rolls of cotton plain fabric, 145gsm, 58\", dyed navy. Roll length has not been decided.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 064",
    "input": "Requirement is 5 lakh metres of 65/35 poly-cotton plain weave, 145 GSM, 58-inch finished width, dyed white, with staggered delivery.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 065",
    "input": "Need 2.5 thousand metres of 100% viscose twill, 135 GSM, 58\", dyed green.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 066",
    "input": "Trial order 500m, possible future bulk 20,000m. 100% cotton twill, 200gsm, 58\", dyed black. Please quote the trial separately.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 067",
    "input": "Navy 300m, black 700m, total 1000m. 100% cotton plain fabric, 145gsm, 58 inches finished, dyed.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 068",
    "input": "6000m total in three colours. Names and splits to be confirmed after shade approval. P/V 65/35, 200gsm, 2/2 twill, 58-inch finished width, dyed.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 069",
    "input": "Need 5000 metres of 100% polyester plain fabric, 150gsm, width 150 cm, dyed navy. Ready stock preferred.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 070",
    "input": "Cotton twill, 200gsm, 58\", dyed black. Qty 30k mts. Minimum acceptable supply is above 5000m. Main order requirement remains 30,000 metres.",
    "category": "quantity_edge_cases",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 071",
    "input": "100% cotton 2/1 twill, 180 GSM, 58 inches, dyed navy, 3000m. Peach finish and soft hand feel required.",
    "category": "finishes_and_knits",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 072",
    "input": "100% polyester plain fabric, 150 GSM, 58\", dyed black, 4000m. Non-fluorine water-repellent finish required.",
    "category": "finishes_and_knits",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 073",
    "input": "Cotton poplin 100%, 120gsm, 58\", dyed white, 5000m. Wrinkle-free finish is compulsory.",
    "category": "finishes_and_knits",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 074",
    "input": "65/35 polyester-cotton plain fabric, 145gsm, 58\", dyed blue, 3000m, antimicrobial finish.",
    "category": "finishes_and_knits",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 075",
    "input": "92/8 polyester-elastane stretch woven, 180 GSM, 58\", dyed charcoal, 2500m. Moisture-management and anti-odour finishes required.",
    "category": "finishes_and_knits",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 076",
    "input": "Cotton twill 200gsm, 58\", dyed beige, 5000m. Do not apply peach finish. Soft finish only.",
    "category": "finishes_and_knits",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 077",
    "input": "100% cotton plain fabric, 145gsm, 58\", dyed white, 2000m. Non-lycra. No elastane should be added.",
    "category": "finishes_and_knits",
    "split": "dev",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 078",
    "input": "100% cotton single jersey, 180 GSM, dyed navy, 500 kg. Bio-wash finish preferred. Width to be confirmed.",
    "category": "finishes_and_knits",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 079",
    "input": "95% cotton and 5% elastane rib knit, 240 GSM, dyed black, 300 kg. Width unknown. Woven EPI/PPI construction is not applicable.",
    "category": "finishes_and_knits",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 080",
    "input": "100% polyester nonwoven fabric, 50 GSM, 160 cm width, white, 2000 kg. Yarn count and woven construction are not applicable.",
    "category": "finishes_and_knits",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 081",
    "input": "A) 16 OE × 16 OE / 96 × 60, 65” RS, 2/2 Matty (OL)\nOPTION 1 100% GOTS NOP-certified organic cotton\nOPTION 2 BCI cotton\nOPTION 3 Regen Agri Cotton\n\nB) 20 CCW × 20 CCW / 96 × 48, 3/1 Drill\nOPTION 1 100% GOTS NOP-certified organic cotton\nOPTION 2 BCI cotton\nOPTION 3 Regen Agri Cotton",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 2
  },
  {
    "id": "TEST 082",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3000m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed black, 2000m.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 2
  },
  {
    "id": "TEST 083",
    "input": "Need cotton plain fabric, 145gsm, 58\", dyed navy, 2000m.\nAlso need a separate polyester satin, 110gsm, 58\", dyed maroon, 1000m.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 2
  },
  {
    "id": "TEST 084",
    "input": "1) 65/35 poly-cotton, plain, 150gsm, 58\", dyed white, 5000m.\n2) 100% cotton, 3/1 twill, 240gsm, 60\", dyed black, 3000m.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 2
  },
  {
    "id": "TEST 085",
    "input": "Cotton poplin, 100% cotton, 120 GSM, 58\", RFD, 1000m.\n---\nViscose twill, 100% viscose, 135 GSM, 58\", dyed olive, 1500m.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 2
  },
  {
    "id": "TEST 086",
    "input": "One fabric: 100% cotton twill, 200gsm, 58\", 5000m.\nOption A: RFD.\nOption B: dyed navy.\nPlease quote both processing alternatives for the same fabric requirement.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 087",
    "input": "Need either 100% cotton or 65/35 poly-cotton plain weave, 145gsm, 58\", dyed white, 3000m. These are material alternatives for one requirement.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 088",
    "input": "A. Cotton poplin\n40s × 40s / 133 × 72\n120gsm, 58\", RFD, 2000m\n100% cotton\n\nB. Viscose twill\n30s × 30s / 100 × 72\n135gsm, 58\", dyed black, 1000m\n100% viscose",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 2
  },
  {
    "id": "TEST 089",
    "input": "Need two qualities.\nFirst: 100% cotton plain, 145gsm, 58\", dyed navy, 1000m.\nSecond: 100% cotton 3/1 twill, 240gsm, 60\", dyed black, 2000m.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 2
  },
  {
    "id": "TEST 090",
    "input": "Please quote:\nA) 100% cotton poplin, 120gsm, 58\", RFD, 1000m.\nB) 100% viscose twill, 135gsm, 58\", dyed black, 1500m.\nC) 100% polyester satin, 110gsm, 58\", dyed maroon, 2000m.\nAll three must be delivered to Surat.",
    "category": "multi_fabric_options",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 3
  },
  {
    "id": "TEST 091",
    "input": "Need cotton uniform fabric, around 2000m. Please suggest suitable GSM, weave and width. These specifications are not finalized.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 092",
    "input": "Need 40x40 cotton fabric, 500m. I do not know whether 40x40 refers to yarn count or construction. Please confirm before proceeding.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 093",
    "input": "Supplier calls the fabric Moonlight Special. Blend, weave and GSM are unknown. Need 1000 metres after sample approval.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 094",
    "input": "Need navy fabric, 180gsm, 58\", 2000m. Blend and weave unknown. Ready stock is not required; made to order is acceptable.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 095",
    "input": "Need 65% polyester and 45% cotton, plain weave, 150gsm, 58\", dyed white, 5000m. Please review the composition percentages.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 096",
    "input": "100% cotton twill, 200gsm, 58\", dyed.\nNavy 300m.\nBlack 400m.\nThe stated total is 1000m.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 097",
    "input": "100% cotton plain fabric, 145gsm, 3000m, dyed white.\nOne note says finished width 58 inches.\nAnother note says finished width 60 inches.\nWidth needs confirmation.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 098",
    "input": "100% cotton plain fabric, 145gsm, 58\", 2000m.\nHeading says RFD.\nFinal instruction says dyed navy.\nPlease confirm the required fabric state.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 099",
    "input": "Warp P/V 65/35, 20s.\nWeft P/V 50/50, 20s.\nConstruction 100x56.\n2/2 twill, 63\" greige width.\n5000m.\nOverall fabric blend percentage has not been confirmed.",
    "category": "ambiguities_and_conflicts",
    "split": "validation",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 100",
    "input": "Warp P/V 65/35, 20s.\nWeft P/V 65/35, 20s.\nConstruction 100x56.\n2/2 twill, 63\" greige width.\n5000m.\nBoth yarns have the same stated composition.",
    "category": "ambiguities_and_conflicts",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 101",
    "input": "Cotton plain fabric. Count 40s x 40s, construction 133 x 72. Greige width 63 inches; finished cuttable width 58 inches. 120 GSM, dyed white, 3000m.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 102",
    "input": "Polyester plain weave, 150gsm. Width written as 63, unit not mentioned. Need 2000m dyed black.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 103",
    "input": "Need 145 gsm ready 100m per col (500 m total) - blue, black, green, yellow, orange 58\". Blend and weave to be confirmed.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 104",
    "input": "Need 145 gsm ready 100m per sol (500 m total) - blue, black, green, yellow, orange 58\". Meaning of \"per sol\" has not been clarified.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 105",
    "input": "100% cotton, plain, 145gsm, 58 inches, RFD, 3000m. We will dye it navy later at our own unit. Supply must remain RFD.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 106",
    "input": "For the cotton poplin requirement, revise quantity from 1000m to 1500m. Keep 100% cotton, 120gsm, 58\" and RFD unchanged. This updates the same fabric.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 107",
    "input": "100% cotton plain fabric, 145 GSM ±5%, 58-inch finished width, dyed navy, 5000m. Delivery needed within 4 weeks of approval.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 108",
    "input": "Need cotton poplin, 100% cotton, 120gsm, 58\", dyed white, 3000m. Target price ₹150-170 per metre, excluding GST. Required by 15 December 2026.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 109",
    "input": "Polyester satin, 110gsm, 58\", dyed maroon, 2000m. Quote in USD per yard. Delivery date is not fixed; tell us your earliest possible dispatch.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 110",
    "input": "Please quote 100% cotton, 20 by 16, construction 108 by 56, 3/1 twill, 240gsm, 58-inch finished width, dyed, non-lycra, peach finish.\nNeed 500m per colour in navy, black and olive, total 1500m.\nTarget ₹190/m.\nDeliver to Tiruppur by 15 December 2026.\nNeed a sample first; confirm price and delivery.",
    "category": "revisions_and_commercials",
    "split": "held_out",
    "isProvided110": true,
    "expectedCount": 1
  },
  {
    "id": "TEST 111",
    "input": "Hi, need cotton poplin in navy, around 120 gsm, 58\". Qty 1000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 120,
      "width": "58 inches",
      "quantity": 1000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 112",
    "input": "Hi, need poly viscose twill in black, around 125 gsm, 58\". Qty 1250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 125,
      "width": "58 inches",
      "quantity": 1250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 113",
    "input": "Hi, need cotton cambric in olive, around 130 gsm, 58\". Qty 1500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 130,
      "width": "58 inches",
      "quantity": 1500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 114",
    "input": "Hi, need linen blend in white, around 135 gsm, 58\". Qty 1750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 135,
      "width": "58 inches",
      "quantity": 1750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 115",
    "input": "Hi, need rayon twill in maroon, around 140 gsm, 58\". Qty 2000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 2000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 116",
    "input": "Hi, need cotton poplin in beige, around 145 gsm, 58\". Qty 2250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 145,
      "width": "58 inches",
      "quantity": 2250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 117",
    "input": "Hi, need poly viscose twill in bottle green, around 150 gsm, 58\". Qty 2500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 150,
      "width": "58 inches",
      "quantity": 2500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 118",
    "input": "Hi, need cotton cambric in navy, around 155 gsm, 58\". Qty 2750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 2750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 119",
    "input": "Hi, need linen blend in black, around 160 gsm, 58\". Qty 3000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 160,
      "width": "58 inches",
      "quantity": 3000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 120",
    "input": "Hi, need rayon twill in olive, around 165 gsm, 58\". Qty 3250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 165,
      "width": "58 inches",
      "quantity": 3250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 121",
    "input": "Hi, need cotton poplin in white, around 170 gsm, 58\". Qty 3500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 3500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 122",
    "input": "Hi, need poly viscose twill in maroon, around 175 gsm, 58\". Qty 3750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 175,
      "width": "58 inches",
      "quantity": 3750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 123",
    "input": "Hi, need cotton cambric in beige, around 180 gsm, 58\". Qty 4000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 180,
      "width": "58 inches",
      "quantity": 4000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 124",
    "input": "Hi, need linen blend in bottle green, around 185 gsm, 58\". Qty 4250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 4250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 125",
    "input": "Hi, need rayon twill in navy, around 190 gsm, 58\". Qty 4500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 190,
      "width": "58 inches",
      "quantity": 4500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 126",
    "input": "Hi, need cotton poplin in black, around 195 gsm, 58\". Qty 4750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 195,
      "width": "58 inches",
      "quantity": 4750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 127",
    "input": "Hi, need poly viscose twill in olive, around 200 gsm, 58\". Qty 5000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "quantity": 5000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 128",
    "input": "Hi, need cotton cambric in white, around 205 gsm, 58\". Qty 5250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 205,
      "width": "58 inches",
      "quantity": 5250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 129",
    "input": "Hi, need linen blend in maroon, around 210 gsm, 58\". Qty 5500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 210,
      "width": "58 inches",
      "quantity": 5500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 130",
    "input": "Hi, need rayon twill in beige, around 215 gsm, 58\". Qty 5750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 215,
      "width": "58 inches",
      "quantity": 5750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 131",
    "input": "Hi, need cotton poplin in bottle green, around 120 gsm, 58\". Qty 6000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 120,
      "width": "58 inches",
      "quantity": 6000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 132",
    "input": "Hi, need poly viscose twill in navy, around 125 gsm, 58\". Qty 6250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 125,
      "width": "58 inches",
      "quantity": 6250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 133",
    "input": "Hi, need cotton cambric in black, around 130 gsm, 58\". Qty 6500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 130,
      "width": "58 inches",
      "quantity": 6500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 134",
    "input": "Hi, need linen blend in olive, around 135 gsm, 58\". Qty 6750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 135,
      "width": "58 inches",
      "quantity": 6750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 135",
    "input": "Hi, need rayon twill in white, around 140 gsm, 58\". Qty 7000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 7000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 136",
    "input": "Hi, need cotton poplin in maroon, around 145 gsm, 58\". Qty 7250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 145,
      "width": "58 inches",
      "quantity": 7250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 137",
    "input": "Hi, need poly viscose twill in beige, around 150 gsm, 58\". Qty 7500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 150,
      "width": "58 inches",
      "quantity": 7500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 138",
    "input": "Hi, need cotton cambric in bottle green, around 155 gsm, 58\". Qty 7750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 7750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 139",
    "input": "Hi, need linen blend in navy, around 160 gsm, 58\". Qty 8000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 160,
      "width": "58 inches",
      "quantity": 8000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 140",
    "input": "Hi, need rayon twill in black, around 165 gsm, 58\". Qty 8250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 165,
      "width": "58 inches",
      "quantity": 8250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 141",
    "input": "Hi, need cotton poplin in olive, around 170 gsm, 58\". Qty 8500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 8500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 142",
    "input": "Hi, need poly viscose twill in white, around 175 gsm, 58\". Qty 8750m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 175,
      "width": "58 inches",
      "quantity": 8750,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 143",
    "input": "Hi, need cotton cambric in maroon, around 180 gsm, 58\". Qty 9000m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 180,
      "width": "58 inches",
      "quantity": 9000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 144",
    "input": "Hi, need linen blend in beige, around 185 gsm, 58\". Qty 9250m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 9250,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 145",
    "input": "Hi, need rayon twill in bottle green, around 190 gsm, 58\". Qty 9500m ready stock. Fast quote pls.",
    "category": "whatsapp_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 190,
      "width": "58 inches",
      "quantity": 9500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 146",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 130 GSM\nState: RFD\nOrder quantity: 3000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 70",
      "gsm": 130,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 3000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 147",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 133 GSM\nState: RFD\nOrder quantity: 3500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "110 x 74",
      "gsm": 133,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 3500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 148",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 136 GSM\nState: RFD\nOrder quantity: 4000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "120 x 78",
      "gsm": 136,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 4000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 149",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 139 GSM\nState: RFD\nOrder quantity: 4500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "130 x 82",
      "gsm": 139,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 4500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 150",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 142 GSM\nState: RFD\nOrder quantity: 5000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "100 x 70",
      "gsm": 142,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 5000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 151",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 145 GSM\nState: RFD\nOrder quantity: 5500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "110 x 74",
      "gsm": 145,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 5500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 152",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 148 GSM\nState: RFD\nOrder quantity: 6000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "120 x 78",
      "gsm": 148,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 6000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 153",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 151 GSM\nState: RFD\nOrder quantity: 6500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "130 x 82",
      "gsm": 151,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 6500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 154",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 154 GSM\nState: RFD\nOrder quantity: 7000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "100 x 70",
      "gsm": 154,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 7000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 155",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 157 GSM\nState: RFD\nOrder quantity: 7500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "110 x 74",
      "gsm": 157,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 7500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 156",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 160 GSM\nState: RFD\nOrder quantity: 8000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "120 x 78",
      "gsm": 160,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 8000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 157",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 163 GSM\nState: RFD\nOrder quantity: 8500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "130 x 82",
      "gsm": 163,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 8500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 158",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 166 GSM\nState: RFD\nOrder quantity: 9000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 70",
      "gsm": 166,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 9000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 159",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 169 GSM\nState: RFD\nOrder quantity: 9500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "110 x 74",
      "gsm": 169,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 9500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 160",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 172 GSM\nState: RFD\nOrder quantity: 10000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "120 x 78",
      "gsm": 172,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 10000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 161",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 175 GSM\nState: RFD\nOrder quantity: 10500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "130 x 82",
      "gsm": 175,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 10500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 162",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 178 GSM\nState: RFD\nOrder quantity: 11000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "100 x 70",
      "gsm": 178,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 11000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 163",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 181 GSM\nState: RFD\nOrder quantity: 11500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "110 x 74",
      "gsm": 181,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 11500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 164",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 184 GSM\nState: RFD\nOrder quantity: 12000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "120 x 78",
      "gsm": 184,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 12000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 165",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 187 GSM\nState: RFD\nOrder quantity: 12500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "130 x 82",
      "gsm": 187,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 12500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 166",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 190 GSM\nState: RFD\nOrder quantity: 13000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "100 x 70",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 13000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 167",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 193 GSM\nState: RFD\nOrder quantity: 13500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "110 x 74",
      "gsm": 193,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 13500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 168",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 196 GSM\nState: RFD\nOrder quantity: 14000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "120 x 78",
      "gsm": 196,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 14000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 169",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 199 GSM\nState: RFD\nOrder quantity: 14500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "130 x 82",
      "gsm": 199,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 14500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 170",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 202 GSM\nState: RFD\nOrder quantity: 15000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 70",
      "gsm": 202,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 15000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 171",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 205 GSM\nState: RFD\nOrder quantity: 15500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "110 x 74",
      "gsm": 205,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 15500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 172",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 208 GSM\nState: RFD\nOrder quantity: 16000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "120 x 78",
      "gsm": 208,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 16000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 173",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 211 GSM\nState: RFD\nOrder quantity: 16500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "130 x 82",
      "gsm": 211,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 16500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 174",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 214 GSM\nState: RFD\nOrder quantity: 17000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "100 x 70",
      "gsm": 214,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 17000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 175",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 217 GSM\nState: RFD\nOrder quantity: 17500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "110 x 74",
      "gsm": 217,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 17500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 176",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 130 GSM\nState: RFD\nOrder quantity: 18000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "120 x 78",
      "gsm": 130,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 18000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 177",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 130 x 82\nWeave: Plain\nFinished Width: 58 inches\nWeight: 133 GSM\nState: RFD\nOrder quantity: 18500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "130 x 82",
      "gsm": 133,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 18500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 178",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 50s x 50s\nConstruction: 100 x 70\nWeave: Plain\nFinished Width: 58 inches\nWeight: 136 GSM\nState: RFD\nOrder quantity: 19000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "50s x 50s",
      "construction": "100 x 70",
      "gsm": 136,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 19000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 179",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 30s x 30s\nConstruction: 110 x 74\nWeave: Plain\nFinished Width: 58 inches\nWeight: 139 GSM\nState: RFD\nOrder quantity: 19500 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "110 x 74",
      "gsm": 139,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 19500,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 180",
    "input": "Dear Team,\nWe are inviting quotes for 100% cotton fabric.\nSpecifications:\nCount: 40s x 40s\nConstruction: 120 x 78\nWeave: Plain\nFinished Width: 58 inches\nWeight: 142 GSM\nState: RFD\nOrder quantity: 20000 metres.\nDelivery to Ahmedabad.",
    "category": "formal_email",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "120 x 78",
      "gsm": 142,
      "width": "58 inches",
      "fabricState": "rfd",
      "quantity": 20000,
      "weaveType": "Plain"
    }
  },
  {
    "id": "TEST 181",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 180\nWidth: 58 inches finished\nState: Dyed\nQuantity: 2000m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 180,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2000,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 182",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 190\nWidth: 58 inches finished\nState: Dyed\nQuantity: 2200m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2200,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 183",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 200\nWidth: 58 inches finished\nState: Dyed\nQuantity: 2400m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2400,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 184",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 210\nWidth: 58 inches finished\nState: Dyed\nQuantity: 2600m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 210,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2600,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 185",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 220\nWidth: 58 inches finished\nState: Dyed\nQuantity: 2800m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 220,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2800,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 186",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 180\nWidth: 58 inches finished\nState: Dyed\nQuantity: 3000m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 180,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 187",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 190\nWidth: 58 inches finished\nState: Dyed\nQuantity: 3200m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3200,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 188",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 200\nWidth: 58 inches finished\nState: Dyed\nQuantity: 3400m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3400,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 189",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 210\nWidth: 58 inches finished\nState: Dyed\nQuantity: 3600m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 210,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3600,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 190",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 220\nWidth: 58 inches finished\nState: Dyed\nQuantity: 3800m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 220,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3800,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 191",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 180\nWidth: 58 inches finished\nState: Dyed\nQuantity: 4000m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 180,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 192",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 190\nWidth: 58 inches finished\nState: Dyed\nQuantity: 4200m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4200,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 193",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 200\nWidth: 58 inches finished\nState: Dyed\nQuantity: 4400m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4400,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 194",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 210\nWidth: 58 inches finished\nState: Dyed\nQuantity: 4600m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 210,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4600,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 195",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 220\nWidth: 58 inches finished\nState: Dyed\nQuantity: 4800m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 220,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4800,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 196",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 180\nWidth: 58 inches finished\nState: Dyed\nQuantity: 5000m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 180,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5000,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 197",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 190\nWidth: 58 inches finished\nState: Dyed\nQuantity: 5200m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5200,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 198",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 200\nWidth: 58 inches finished\nState: Dyed\nQuantity: 5400m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5400,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 199",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 210\nWidth: 58 inches finished\nState: Dyed\nQuantity: 5600m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 210,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5600,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 200",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 220\nWidth: 58 inches finished\nState: Dyed\nQuantity: 5800m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 220,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5800,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 201",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 180\nWidth: 58 inches finished\nState: Dyed\nQuantity: 6000m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 180,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6000,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 202",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 190\nWidth: 58 inches finished\nState: Dyed\nQuantity: 6200m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6200,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 203",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 200\nWidth: 58 inches finished\nState: Dyed\nQuantity: 6400m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6400,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 204",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 210\nWidth: 58 inches finished\nState: Dyed\nQuantity: 6600m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 210,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6600,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 205",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 220\nWidth: 58 inches finished\nState: Dyed\nQuantity: 6800m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 220,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6800,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 206",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 180\nWidth: 58 inches finished\nState: Dyed\nQuantity: 7000m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 180,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7000,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 207",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 190\nWidth: 58 inches finished\nState: Dyed\nQuantity: 7200m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7200,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 208",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 200\nWidth: 58 inches finished\nState: Dyed\nQuantity: 7400m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7400,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 209",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 210\nWidth: 58 inches finished\nState: Dyed\nQuantity: 7600m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 210,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7600,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 210",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 220\nWidth: 58 inches finished\nState: Dyed\nQuantity: 7800m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 220,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7800,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 211",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 180\nWidth: 58 inches finished\nState: Dyed\nQuantity: 8000m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 180,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8000,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 212",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 190\nWidth: 58 inches finished\nState: Dyed\nQuantity: 8200m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 190,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8200,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 213",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 200\nWidth: 58 inches finished\nState: Dyed\nQuantity: 8400m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8400,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 214",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 210\nWidth: 58 inches finished\nState: Dyed\nQuantity: 8600m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 210,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8600,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 215",
    "input": "Fabric: Uniform Twill\nComposition: 65% polyester / 35% viscose\nWeave: 2/2 Twill\nGSM: 220\nWidth: 58 inches finished\nState: Dyed\nQuantity: 8800m\nProduction: Made to order",
    "category": "multiline_key_value",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Viscose",
      "weaveType": "2/2 Twill",
      "gsm": 220,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8800,
      "productionCycle": "made_to_order"
    }
  },
  {
    "id": "TEST 216",
    "input": "Bhai 140 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 1500 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 1500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 217",
    "input": "Bhai 155 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 1600 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 1600,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 218",
    "input": "Bhai 170 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 1700 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 1700,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 219",
    "input": "Bhai 185 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 1800 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 1800,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 220",
    "input": "Bhai 200 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 1900 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "quantity": 1900,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 221",
    "input": "Bhai 140 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2000 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 2000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 222",
    "input": "Bhai 155 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2100 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 2100,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 223",
    "input": "Bhai 170 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2200 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 2200,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 224",
    "input": "Bhai 185 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2300 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 2300,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 225",
    "input": "Bhai 200 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2400 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "quantity": 2400,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 226",
    "input": "Bhai 140 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2500 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 2500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 227",
    "input": "Bhai 155 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2600 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 2600,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 228",
    "input": "Bhai 170 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2700 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 2700,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 229",
    "input": "Bhai 185 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2800 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 2800,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 230",
    "input": "Bhai 200 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 2900 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "quantity": 2900,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 231",
    "input": "Bhai 140 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3000 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 3000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 232",
    "input": "Bhai 155 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3100 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 3100,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 233",
    "input": "Bhai 170 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3200 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 3200,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 234",
    "input": "Bhai 185 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3300 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 3300,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 235",
    "input": "Bhai 200 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3400 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "quantity": 3400,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 236",
    "input": "Bhai 140 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3500 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 3500,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 237",
    "input": "Bhai 155 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3600 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 3600,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 238",
    "input": "Bhai 170 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3700 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 3700,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 239",
    "input": "Bhai 185 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3800 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 3800,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 240",
    "input": "Bhai 200 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 3900 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "quantity": 3900,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 241",
    "input": "Bhai 140 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 4000 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 140,
      "width": "58 inches",
      "quantity": 4000,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 242",
    "input": "Bhai 155 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 4100 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 155,
      "width": "58 inches",
      "quantity": 4100,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 243",
    "input": "Bhai 170 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 4200 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 170,
      "width": "58 inches",
      "quantity": 4200,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 244",
    "input": "Bhai 185 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 4300 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 185,
      "width": "58 inches",
      "quantity": 4300,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 245",
    "input": "Bhai 200 gsm cotton twill chahiye 58 inch width me, navy blue dyed. Total 4400 metre order hoga. Sample piece courier kardo.",
    "category": "hinglish_informal",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "quantity": 4400,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 246",
    "input": "Warp 75D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 2000m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2000,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 247",
    "input": "Warp 100D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 2200m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2200,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 248",
    "input": "Warp 125D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 2400m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2400,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 249",
    "input": "Warp 150D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 2600m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2600,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 250",
    "input": "Warp 75D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 2800m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2800,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 251",
    "input": "Warp 100D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 3000m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 252",
    "input": "Warp 125D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 3200m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3200,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 253",
    "input": "Warp 150D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 3400m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3400,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 254",
    "input": "Warp 75D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 3600m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3600,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 255",
    "input": "Warp 100D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 3800m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3800,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 256",
    "input": "Warp 125D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 4000m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 257",
    "input": "Warp 150D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 4200m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4200,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 258",
    "input": "Warp 75D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 4400m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4400,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 259",
    "input": "Warp 100D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 4600m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4600,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 260",
    "input": "Warp 125D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 4800m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4800,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 261",
    "input": "Warp 150D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 5000m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5000,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 262",
    "input": "Warp 75D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 5200m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5200,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 263",
    "input": "Warp 100D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 5400m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5400,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 264",
    "input": "Warp 125D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 5600m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5600,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 265",
    "input": "Warp 150D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 5800m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 5800,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 266",
    "input": "Warp 75D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 6000m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6000,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 267",
    "input": "Warp 100D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 6200m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6200,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 268",
    "input": "Warp 125D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 6400m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6400,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 269",
    "input": "Warp 150D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 6600m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6600,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 270",
    "input": "Warp 75D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 6800m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 6800,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 271",
    "input": "Warp 100D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 7000m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7000,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 272",
    "input": "Warp 125D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 7200m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7200,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 273",
    "input": "Warp 150D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 7400m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7400,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 274",
    "input": "Warp 75D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 7600m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7600,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 275",
    "input": "Warp 100D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 7800m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 7800,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 276",
    "input": "Warp 125D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 8000m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8000,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 277",
    "input": "Warp 150D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 8200m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8200,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 278",
    "input": "Warp 75D/72F micro poly FD x Weft 250D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 8400m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8400,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 279",
    "input": "Warp 100D/72F micro poly FD x Weft 150D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 8600m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8600,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 280",
    "input": "Warp 125D/72F micro poly FD x Weft 200D poly DTY, construction 90x60, 58 inches cuttable width, dyed black, 8800m. Weave plain.",
    "category": "complex_denier_yarns",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "construction": "90x60",
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 8800,
      "weaveType": "plain"
    }
  },
  {
    "id": "TEST 281",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 282",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 283",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 65\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 65
    }
  },
  {
    "id": "TEST 284",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 66\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 66
    }
  },
  {
    "id": "TEST 285",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 286",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 287",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 65\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 65
    }
  },
  {
    "id": "TEST 288",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 66\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 66
    }
  },
  {
    "id": "TEST 289",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 290",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 291",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 65\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 65
    }
  },
  {
    "id": "TEST 292",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 66\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 66
    }
  },
  {
    "id": "TEST 293",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 294",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 295",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 65\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 65
    }
  },
  {
    "id": "TEST 296",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 66\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 66
    }
  },
  {
    "id": "TEST 297",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 298",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 299",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 65\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 65
    }
  },
  {
    "id": "TEST 300",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 66\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 66
    }
  },
  {
    "id": "TEST 301",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 302",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 303",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 65\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 65
    }
  },
  {
    "id": "TEST 304",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 66\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 66
    }
  },
  {
    "id": "TEST 305",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 306",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 307",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 65\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 65
    }
  },
  {
    "id": "TEST 308",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 66\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 66
    }
  },
  {
    "id": "TEST 309",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 63\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 63
    }
  },
  {
    "id": "TEST 310",
    "input": "40s x 40s / 133 x 72, 100% cotton poplin, 64\" greige width, 2/1 twill, 4000m. Greige state only.",
    "category": "greige_width_basis",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "40s x 40s",
      "construction": "133 x 72",
      "fabricState": "greige",
      "quantity": 4000,
      "greigeWidth": 64
    }
  },
  {
    "id": "TEST 311",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 312",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 313",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 314",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 315",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 316",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 317",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 318",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 319",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 320",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 321",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 322",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 323",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 324",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 325",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 326",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 327",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 328",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 329",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 330",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 331",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 332",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 333",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 63 inches, finished cuttable width 57 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "57 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 334",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 64 inches, finished cuttable width 58 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "58 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 335",
    "input": "Count 30s x 30s, construction 100 x 72, 100% cotton. Greige width 62 inches, finished cuttable width 56 inches. 135 GSM, dyed white, 3500m.",
    "category": "dual_width_greige_finished",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "count": "30s x 30s",
      "construction": "100 x 72",
      "width": "56 inches",
      "gsm": 135,
      "quantity": 3500
    }
  },
  {
    "id": "TEST 336",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2000m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 1500m.",
    "category": "multi_fabric_segmented",
    "split": "validation",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 337",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2100m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 1600m.",
    "category": "multi_fabric_segmented",
    "split": "held_out",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 338",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2200m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 1700m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 339",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2300m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 1800m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 340",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2400m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 1900m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 341",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2500m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2000m.",
    "category": "multi_fabric_segmented",
    "split": "validation",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 342",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2600m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2100m.",
    "category": "multi_fabric_segmented",
    "split": "held_out",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 343",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2700m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2200m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 344",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2800m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2300m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 345",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 2900m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2400m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 346",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3000m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2500m.",
    "category": "multi_fabric_segmented",
    "split": "validation",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 347",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3100m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2600m.",
    "category": "multi_fabric_segmented",
    "split": "held_out",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 348",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3200m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2700m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 349",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3300m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2800m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 350",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3400m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 2900m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 351",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3500m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3000m.",
    "category": "multi_fabric_segmented",
    "split": "validation",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 352",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3600m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3100m.",
    "category": "multi_fabric_segmented",
    "split": "held_out",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 353",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3700m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3200m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 354",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3800m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3300m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 355",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 3900m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3400m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 356",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4000m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3500m.",
    "category": "multi_fabric_segmented",
    "split": "validation",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 357",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4100m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3600m.",
    "category": "multi_fabric_segmented",
    "split": "held_out",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 358",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4200m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3700m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 359",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4300m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3800m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 360",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4400m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 3900m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 361",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4500m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4000m.",
    "category": "multi_fabric_segmented",
    "split": "validation",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 362",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4600m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4100m.",
    "category": "multi_fabric_segmented",
    "split": "held_out",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 363",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4700m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4200m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 364",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4800m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4300m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 365",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 4900m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4400m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 366",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 5000m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4500m.",
    "category": "multi_fabric_segmented",
    "split": "validation",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 367",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 5100m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4600m.",
    "category": "multi_fabric_segmented",
    "split": "held_out",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 368",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 5200m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4700m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 369",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 5300m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4800m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 370",
    "input": "Fabric 1: 100% cotton poplin, 120 GSM, 58\", RFD, 5400m.\nFabric 2: 100% viscose twill, 135 GSM, 58\", dyed navy, 4900m.",
    "category": "multi_fabric_segmented",
    "split": "dev",
    "expectedCount": 2,
    "expected": {}
  },
  {
    "id": "TEST 371",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 3000m.",
    "category": "quantity_bounds",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 372",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 3200m.",
    "category": "quantity_bounds",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 373",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 3400m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 374",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 3600m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 375",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 3800m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 376",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 4000m.",
    "category": "quantity_bounds",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 377",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 4200m.",
    "category": "quantity_bounds",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 378",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 4400m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 379",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 4600m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 380",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 4800m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 381",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 5000m.",
    "category": "quantity_bounds",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 382",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 5200m.",
    "category": "quantity_bounds",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 383",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 5400m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 384",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 5600m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 385",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 5800m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 386",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 6000m.",
    "category": "quantity_bounds",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 387",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 6200m.",
    "category": "quantity_bounds",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 388",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 6400m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 389",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 6600m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 390",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 6800m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 391",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 7000m.",
    "category": "quantity_bounds",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 392",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 7200m.",
    "category": "quantity_bounds",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 393",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 7400m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 394",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 7600m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 395",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 7800m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 396",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 8000m.",
    "category": "quantity_bounds",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 397",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 8200m.",
    "category": "quantity_bounds",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 398",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 8400m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 399",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be at least 8600m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 400",
    "input": "100% cotton 3/1 drill, 240 GSM, 58\" finished width, dyed black. Quantity would be above 8800m.",
    "category": "quantity_bounds",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 240,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantityStatus": "bound"
    }
  },
  {
    "id": "TEST 401",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 402",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 403",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 404",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 405",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 406",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 407",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 408",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 409",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 410",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 411",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 412",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 413",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 414",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 415",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 416",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 417",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 418",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 419",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 420",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 421",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 422",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 423",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 424",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 425",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 426",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 427",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 428",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 400m per colour in navy, black and olive (total 1200m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1200
    }
  },
  {
    "id": "TEST 429",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 500m per colour in navy, black and olive (total 1500m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1500
    }
  },
  {
    "id": "TEST 430",
    "input": "Cotton twill 200gsm, 58\", dyed. Need 600m per colour in navy, black and olive (total 1800m).",
    "category": "per_colour_splits",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "gsm": 200,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 1800
    }
  },
  {
    "id": "TEST 431",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 432",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 433",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 434",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 435",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 436",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 437",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 438",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 439",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 440",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 441",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 442",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 443",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 444",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 445",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 446",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 447",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 448",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 449",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 450",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 451",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 452",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 453",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 454",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 455",
    "input": "100% cotton plain weave, 140 GSM, 58 inches, dyed beige, 2500m. Non-lycra. No elastane. Do not apply peach finish.",
    "category": "negations_and_exclusions",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 140,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 2500
    }
  },
  {
    "id": "TEST 456",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 457",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 458",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 459",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 460",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 461",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 462",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 463",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 464",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 465",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 466",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 467",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 468",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 469",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 470",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 471",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 472",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 473",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 474",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 475",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 476",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 477",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 478",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 479",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 480",
    "input": "Looking for navy uniform fabric, about 2500m. GSM and weave are not finalized yet. Please send swatches.",
    "category": "incomplete_specifications",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "quantity": 2500,
      "gsmStatus": "absent",
      "widthStatus": "absent"
    }
  },
  {
    "id": "TEST 481",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Antimicrobial finish required.",
    "category": "functional_finishes",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 482",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Water-repellent finish required.",
    "category": "functional_finishes",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 483",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Wrinkle-free treatment required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 484",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Peach finish and soft hand feel required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 485",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Antimicrobial finish required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 486",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Water-repellent finish required.",
    "category": "functional_finishes",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 487",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Wrinkle-free treatment required.",
    "category": "functional_finishes",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 488",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Peach finish and soft hand feel required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 489",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Antimicrobial finish required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 490",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Water-repellent finish required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 491",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Wrinkle-free treatment required.",
    "category": "functional_finishes",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 492",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Peach finish and soft hand feel required.",
    "category": "functional_finishes",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 493",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Antimicrobial finish required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 494",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Water-repellent finish required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 495",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Wrinkle-free treatment required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 496",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Peach finish and soft hand feel required.",
    "category": "functional_finishes",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 497",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Antimicrobial finish required.",
    "category": "functional_finishes",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 498",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Water-repellent finish required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 499",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Wrinkle-free treatment required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 500",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Peach finish and soft hand feel required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 501",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Antimicrobial finish required.",
    "category": "functional_finishes",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 502",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Water-repellent finish required.",
    "category": "functional_finishes",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 503",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Wrinkle-free treatment required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 504",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Peach finish and soft hand feel required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 505",
    "input": "65/35 poly cotton plain fabric, 150 GSM, 58\", dyed royal blue, 4000m. Antimicrobial finish required.",
    "category": "functional_finishes",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "65% Polyester 35% Cotton",
      "gsm": 150,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 4000
    }
  },
  {
    "id": "TEST 506",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 507",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 508",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 509",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 510",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 511",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 512",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 513",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 514",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 515",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 516",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 517",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 518",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 519",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 520",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 521",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 522",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 523",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 524",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 525",
    "input": "100% cotton single jersey knit, 180 GSM, dyed black, 600 kg. Width and yarn count will be confirmed later. Bio-wash required.",
    "category": "knits_and_nonwovens",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 180,
      "fabricState": "dyed"
    }
  },
  {
    "id": "TEST 526",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 527",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 528",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 529",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 530",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 531",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 532",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 533",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 534",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 535",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 536",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 537",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 538",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 539",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 540",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 541",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 542",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 543",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 544",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 545",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 546",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 547",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 548",
    "input": "16 OE × 16 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 549",
    "input": "22 OE × 22 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 550",
    "input": "10 OE × 10 OE / 84 × 48, 65\" RS, 100% cotton, 2/2 Matty weave, 3000m.",
    "category": "oe_ringspun_shorthand",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "width": "65 inches",
      "productionCycle": "ready_stock",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 551",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 552",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 553",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 554",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 555",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 556",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 557",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 558",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 559",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 560",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 561",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 562",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 563",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 564",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 565",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 566",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 567",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 568",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 569",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 570",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 571",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 572",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 573",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 574",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 575",
    "input": "40s · 40s — 133 · 72 | 100% cotton | plain weave | 120 gsm | 58” finished | dyed white | 3500m",
    "category": "unicode_separators",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3500
    }
  },
  {
    "id": "TEST 576",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹160/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 577",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹170/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 578",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹180/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 579",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹190/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 580",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹200/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 581",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹160/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 582",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹170/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 583",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹180/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 584",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹190/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 585",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹200/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 586",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹160/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 587",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹170/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 588",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹180/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 589",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹190/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 590",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹200/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 591",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹160/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 592",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹170/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 593",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹180/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 594",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹190/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 595",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹200/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 596",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹160/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 597",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹170/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 598",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹180/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 599",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹190/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 600",
    "input": "100% cotton poplin, 120gsm, 58\", dyed white, 3000m. Target price ₹200/metre. Required delivery by 2026-12-20.",
    "category": "commercial_targets",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 120,
      "width": "58 inches",
      "fabricState": "dyed",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 601",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 602",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 603",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 604",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 605",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 606",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 607",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 608",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 609",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 610",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 611",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 612",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 613",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 614",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 615",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 616",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 617",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 618",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 619",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 620",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 621",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "validation",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 622",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "held_out",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 623",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 624",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  },
  {
    "id": "TEST 625",
    "input": "100% cotton plain, 145gsm, 58\", 2000m. Actually revise quantity to 3000m instead. Confirm rate.",
    "category": "revisions_and_corrections",
    "split": "dev",
    "expectedCount": 1,
    "expected": {
      "blend": "100% Cotton",
      "gsm": 145,
      "width": "58 inches",
      "quantity": 3000
    }
  }
];

import expandedJson from "./eval-dataset-expanded.json";

export const EXPANDED_DATASET: EvalCase[] = expandedJson as EvalCase[];
export const ALL_EVAL_CASES: EvalCase[] = [...EVAL_DATASET, ...EXPANDED_DATASET];

