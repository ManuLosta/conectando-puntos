import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function VendorsLoading() {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Nombre</TableHead>
            <TableHead className="font-semibold">Contacto</TableHead>
            <TableHead className="font-semibold">Última Venta</TableHead>
            <TableHead className="font-semibold text-right">
              Total Vendido
            </TableHead>
            <TableHead className="font-semibold text-center">Estado</TableHead>
            <TableHead className="font-semibold text-center">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-[120px]" />
                  <Skeleton className="h-3 w-[180px]" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[80px]" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-[100px] ml-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-6 w-[60px] mx-auto rounded-full" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-8 w-8 rounded mx-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
