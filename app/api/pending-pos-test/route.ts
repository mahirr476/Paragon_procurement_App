import { NextResponse } from "next/server"

export async function GET() {
  console.log("[Test API] Returning mock pending PO data")
  
  // Mock data matching your actual API structure
  const mockData = {
    PoPendingData: {
      Data: [
        {
          Date: "13/09/25",
          Supplier: "ICR-RPL Maize Purchase Center Dinajpur",
          OrderNo: "001PO/PR/5244",
          RefNo: "",
          DueDate: "25/09/25",
          Branch: "01.Paragon Poultry Ltd Feed Division Baniarchala",
          RequisitionType: "ITEM",
          ItemOrLedgerGroup: "INGREDIENT",
          Item: "Maize",
          MinQty: "200000",
          MaxQty: "220000",
          Unit: "kg",
          Rate: "30.75",
          LastApprovedRate: "6150000.00",
          LastSupplier: "Ashraf Traders.(U. Gurudaspur)",
          TotalAmount: "6150000.00",
          Status: "pending",
          DeliveryType: "Delivered"
        },
        {
          Date: "13/09/25",
          Supplier: "Alal Enterprise",
          OrderNo: "001PO/PR/5245",
          RefNo: "",
          DueDate: "28/10/25",
          Branch: "01.Paragon Poultry Ltd Feed Division Baniarchala",
          RequisitionType: "ITEM",
          ItemOrLedgerGroup: "INGREDIENT",
          Item: "DORB (De Oil Rice Polish)",
          MinQty: "300000",
          MaxQty: "330000",
          Unit: "kg",
          Rate: "23.30",
          LastApprovedRate: "6990000.00",
          LastSupplier: "Hossain Enterprise",
          TotalAmount: "6990000.00",
          Status: "pending",
          DeliveryType: "Delivered"
        },
        {
          Date: "13/09/25",
          Supplier: "M/S Dui Bhai Rice Bran Oil Mill",
          OrderNo: "001PO/PR/5246",
          RefNo: "",
          DueDate: "13/10/25",
          Branch: "01.Paragon Poultry Ltd Feed Division Baniarchala",
          RequisitionType: "ITEM",
          ItemOrLedgerGroup: "INGREDIENT",
          Item: "DORB (De Oil Rice Polish)",
          MinQty: "100000",
          MaxQty: "110000",
          Unit: "kg",
          Rate: "23.30",
          LastApprovedRate: "2330000.00",
          LastSupplier: "Hossain Enterprise",
          TotalAmount: "2330000.00",
          Status: "pending",
          DeliveryType: "Delivered"
        },
        {
          Date: "14/09/25",
          Supplier: "Rahman Trading",
          OrderNo: "001PO/PR/5247",
          RefNo: "REF-001",
          DueDate: "20/09/25",
          Branch: "02.Paragon Poultry Ltd Hatchery Division",
          RequisitionType: "ITEM",
          ItemOrLedgerGroup: "EQUIPMENT",
          Item: "Incubator Parts",
          MinQty: "50",
          MaxQty: "60",
          Unit: "pcs",
          Rate: "5500.00",
          LastApprovedRate: "275000.00",
          LastSupplier: "Rahman Trading",
          TotalAmount: "275000.00",
          Status: "pending",
          DeliveryType: "Delivered"
        },
        {
          Date: "14/09/25",
          Supplier: "Khulna Feed Suppliers",
          OrderNo: "001PO/PR/5248",
          RefNo: "REF-002",
          DueDate: "25/09/25",
          Branch: "01.Paragon Poultry Ltd Feed Division Baniarchala",
          RequisitionType: "ITEM",
          ItemOrLedgerGroup: "INGREDIENT",
          Item: "Soybean Meal",
          MinQty: "150000",
          MaxQty: "165000",
          Unit: "kg",
          Rate: "45.50",
          LastApprovedRate: "6825000.00",
          LastSupplier: "Dhaka Soybean Ltd",
          TotalAmount: "6825000.00",
          Status: "pending",
          DeliveryType: "Delivered"
        }
      ]
    }
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return NextResponse.json({ 
    success: true, 
    data: mockData.PoPendingData.Data,
    count: mockData.PoPendingData.Data.length,
    note: "⚠️ This is TEST DATA for development. Switch to /api/pending-pos for real API data."
  })
}