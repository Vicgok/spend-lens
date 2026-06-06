import { wallets } from '../registry/keywords';

export interface ParsedAccount {
  type: 'ACCOUNT' | 'CARD' | 'WALLET' | null;
  number: string | null;
  name: string | null;
}

/**
 * Detects account type, number (last 4 digits), and brand/wallet name
 * from a normalized token array.
 * Employs a cascade heuristic: Account -> Card -> Wallet -> Special Accounts.
 * Fixes T16 by including array bounds checking.
 */
export function getAccount(tokens: string[]): ParsedAccount {
  if (!tokens || tokens.length === 0) {
    return { type: null, number: null, name: null };
  }

  // STEP 1: Search for "ac" keyword
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Case 1: Standalone "ac"
    if (token === 'ac') {
      if (i + 1 < tokens.length) {
        const cleanVal = tokens[i + 1].replace(/\D/g, '');
        if (cleanVal && !isNaN(parseInt(cleanVal, 10))) {
          return {
            type: 'ACCOUNT',
            number: cleanVal.length > 4 ? cleanVal.slice(-4) : cleanVal,
            name: null
          };
        }
      }
    }

    // Case 2: Bonded "ac1234" patterns
    if (token.startsWith('ac') && token.length > 2) {
      const cleanVal = token.slice(2).replace(/\D/g, '');
      if (cleanVal && !isNaN(parseInt(cleanVal, 10))) {
        return {
          type: 'ACCOUNT',
          number: cleanVal.length > 4 ? cleanVal.slice(-4) : cleanVal,
          name: null
        };
      }
    }
  }

  // STEP 2: Card detection
  const cardKeywords = ['card', 'c_card', 'uni_card', 'one_card', 'slice_card'];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (cardKeywords.includes(token)) {
      let name = 'Credit Card';
      if (token === 'uni_card') name = 'Uni Card';
      else if (token === 'one_card') name = 'One Card';
      else if (token === 'slice_card') name = 'Slice Card';

      let number: string | null = null;
      if (i + 1 < tokens.length) {
        const cleanVal = tokens[i + 1].replace(/\D/g, '');
        if (cleanVal && !isNaN(parseInt(cleanVal, 10))) {
          number = cleanVal.length > 4 ? cleanVal.slice(-4) : cleanVal;
        } else if (i + 2 < tokens.length) {
          const nextNextClean = tokens[i + 2].replace(/\D/g, '');
          if (nextNextClean && !isNaN(parseInt(nextNextClean, 10))) {
            number = nextNextClean.length > 4 ? nextNextClean.slice(-4) : nextNextClean;
          }
        }
      }

      return {
        type: 'CARD',
        number,
        name
      };
    }
  }

  // STEP 3: Wallet detection
  for (const token of tokens) {
    if (wallets.includes(token)) {
      let name = token.charAt(0).toUpperCase() + token.slice(1);
      if (token === 'amazon_pay') name = 'Amazon Pay';
      else if (token === 'gpay') name = 'Google Pay';
      else if (token === 'phonepe') name = 'PhonePe';
      else if (token === 'lazypay') name = 'LazyPay';

      return {
        type: 'WALLET',
        number: null,
        name
      };
    }
  }

  // STEP 4: Special Accounts (e.g. Niyo)
  for (const token of tokens) {
    if (token === 'niyo') {
      return {
        type: 'ACCOUNT',
        number: null,
        name: 'Niyo'
      };
    }
  }

  return { type: null, number: null, name: null };
}
