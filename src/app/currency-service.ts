import { Injectable } from "@angular/core";
import * as inf from "indian-number-format";
import * as indianCurrencyInWords from "indian-currency-in-words";
import { TitleCasePipe } from "@angular/common";

@Injectable({
  providedIn: "root",
})
export class CurrencyService {
  constructor() { }

  getFormattedAmount(amount: number): string {
    if (
      amount === undefined ||
      amount === null ||
      amount === 0 ||
      String(amount) === "null" ||
      String(amount).trim() === ""
    ) {
      return "₹ 0";
    }
    return "₹ " + inf.format(amount, 2);
  }

  getAmountInWords(amount: number): string {
    let amtInWords = "-";
    if (amount) {
      const titlecasePipe = new TitleCasePipe();
      amtInWords = indianCurrencyInWords(amount)
        .replace("Rupees", "")
        .replace("Paisa", "");
      return "Rs. " + titlecasePipe.transform(amtInWords);
    }
    return amtInWords;
  }
}
