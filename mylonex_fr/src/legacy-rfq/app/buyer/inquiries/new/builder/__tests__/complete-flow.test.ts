import { vi } from "vitest";
vi.mock('../../../../../../adapters/http', () => ({ builderFetch: (...args: Parameters<typeof fetch>) => fetch(...args) }))
import { describe, expect, it, afterEach } from "vitest";
import { CASE_A, CASE_A_NO_JOIN, CASE_B } from "../../../../../../src/domains/rfq/text/__tests__/complete-fixtures";
import capture from "../../../../../../src/domains/rfq/text/__tests__/complete-provider-capture.json";
import { extraction, field } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import type { AiExtraction } from "../../../../../../src/domains/rfq/text/ai-schema";
import { readRequirements } from "../read-requirements";
import { confirmTextCandidate } from "../TextCandidateReview";
afterEach(() => vi.unstubAllGlobals());
async function ai(text: string, raw: AiExtraction) {
  const validated = validateAiExtraction(text, raw);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok:true, json:async()=>({ data:{mode:"ai-assisted",...validated,proposals:raw.fabrics} }) }));
  return readRequirements(text,true);
}
for (const useAI of [false,true]) describe(`complete extraction, mode=${useAI ? "AI + local" : "local"}`, () => {
  for (const [name,text] of [["a",CASE_A],["a_no_join",CASE_A_NO_JOIN]] as const) it(name,async()=>{
    const lines=useAI ? await ai(text,capture.find(item=>item.name===name)!.raw as AiExtraction) : await readRequirements(text,false);
    expect(lines).toHaveLength(1); const [line]=lines;
    expect(line).toMatchObject({blend:"65% Polyester 35% Viscose",count:"20s × 20s",draft:{weaveType:"2/2 Twill"}});
    expect(line.construction.replace(/x/g,"×")).toBe("100 × 56");
    for(const name of ["quantity","gsm","productionCycle","fabricState"] as const) expect(line.draft[name]).toBeUndefined();
    expect(line.draft.width).toBe("63 inches");
    expect(line.widthBasis).toBe("greige");
    expect(line.textCandidates).toContainEqual(expect.objectContaining({field:"quantity",value:"> 5000 m",qualifier:"quantity bound",status:"review"}));
    expect(line.draft.additionalSpecs).toContain("above 5000m");
    expect(line.warnings.join(" ")).not.toMatch(/count.*ambiguous|Conflicting total/);
    const bound=line.textCandidates!.find(item=>item.field==="quantity")!;
    expect(confirmTextCandidate(line,bound)).toBe(line);
  });
  it("b",async()=>{
    const [line]=useAI ? await ai(CASE_B,capture.find(item=>item.name==="b")!.raw as AiExtraction) : await readRequirements(CASE_B,false);
    expect(line).toMatchObject({blend:"100% Cotton",count:"20 × 16",construction:"108 × 56",finish:"Peach",draft:{fabricState:"dyed",quantity:30000}});
    expect(line.colours).toEqual([]); expect(line.blendRows?.map(row=>row.fibre)).toEqual(["Cotton"]);
    for (const name of ["weaveType","gsm","productionCycle","targetPriceMax","requiredDeliveryDate"] as const) expect(line.draft[name]).toBeUndefined();
    expect(line.draft.width).toBe("58 inches"); expect(line.widthProvenance).toBe("default");
    expect(line.draft.additionalSpecs).toContain("Non lycra"); expect(line.draft.additionalSpecs).toContain("3 colours"); expect(line.draft.additionalSpecs).toContain("Need price n delivery");
    expect(line.warnings.join(" ")).not.toMatch(/Confirm target price|calendar date|single real target/);
  });
});
it.each(["above 5000m","above (5000m)","at least (5000 mtrs)","not more than 5000m","5000m minimum","5000m+"])("keeps qualified %s out of the exact field even with narrow AI citations",async text=>{
  const match=text.match(/5000\s*(?:mtrs|m)/)![0];
  const [line]=await ai(text,extraction(text,[field("quantity","5000 m",match)]));
  expect(line.draft.quantity).toBeUndefined(); expect(line.textCandidates?.some(item=>item.field==="quantity"&&item.qualifier)).toBe(true);
});
it.each(["30k mts; above 5000m","above 5000m; exact quantity: 30k mts","quantity: (30k mts), above (5000m)"])("preserves compatible exact total: %s",async text=>{
  const [line]=await ai(text,extraction(text,[field("quantity","30000 m","30k mts")]));
  expect(line.draft.quantity).toBe(30000); expect(line.original).toContain("5000");
  expect(line.textCandidates?.some(item=>item.value==="> 5000 m")).toBe(true);
});
it("flags an incompatible bound and exact amount",async()=>{
  const [line]=await readRequirements("4000m exact; above 5000m",false);
  expect(line.draft.quantity).toBeUndefined(); expect(line.warnings.join(" ")).toMatch(/Conflicting exact quantity/);
});
it("does not introduce an excluded fibre or a colour-count caption as a shade",async()=>{
  const [line]=await ai(CASE_B,extraction(CASE_B,[field("blend","97% Cotton 3% Lycra","100% cotton\n20 by 16\n108 by 56\nNon lycra"),field("yarnType","Lycra","Non lycra"),field("colour","3 colours","3 colours")]));
  expect(line.blend).toBe("100% Cotton"); expect(line.draft.yarnType).toBeUndefined(); expect(line.colours).toEqual([]);
});
it("bounds weave at the next labelled field",async()=>{
  const source="100% cotton Plain Order qty: 5000m";
  const [line]=await ai(source,extraction(source,[field("weaveType","Plain Order qty :","Plain Order qty:"),field("quantity","5000 m","Order qty: 5000m")]));
  expect(line.draft.weaveType).toBe("Plain"); expect(line.draft.quantity).toBe(5000);
});
