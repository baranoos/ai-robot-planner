import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { GenerateBillOfMaterialsOutput } from "@/ai/flows/generate-bill-of-materials";

interface BomTableProps {
  bom: GenerateBillOfMaterialsOutput["billOfMaterials"];
}

export default function BomTable({ bom }: BomTableProps) {
  const totalCost = bom.reduce(
    (acc, item) => acc + item.approximatePriceUSD * item.quantity,
    0
  );

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Price (USD)</TableHead>
            <TableHead className="text-center">Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bom.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.component}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.description}
              </TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">
                ${(item.approximatePriceUSD * item.quantity).toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <Button asChild variant="ghost" size="sm">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buy
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-secondary hover:bg-secondary">
            <TableCell colSpan={3} className="font-bold text-right">
              Total Approximate Cost
            </TableCell>
            <TableCell className="text-right font-bold">
              ${totalCost.toFixed(2)}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
