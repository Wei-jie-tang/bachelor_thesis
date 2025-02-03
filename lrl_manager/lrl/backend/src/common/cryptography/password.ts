export function generatePassword(length: number): string {
  const getRandomChar = () => {
    const charSets = ["uppercase", "lowercase", "numbers"];

    const selectedSet = charSets[Math.floor(Math.random() * 3)];

    let charCode;
    switch (selectedSet) {
      case "uppercase":
        charCode = 65 + Math.floor(Math.random() * 25); // Uppercase range from 65 - 90
        break;
      case "lowercase":
        charCode = 97 + Math.floor(Math.random() * 25); // Uppercase range from 97 - 122
        break;
      case "numbers":
        charCode = 48 + Math.floor(Math.random() * 10); // Uppercase range from 97 - 122
        break;
    }
    return String.fromCharCode(charCode);
  };

  let password = "";
  for (let i = 0; i < length; i++) {
    password += getRandomChar();
  }
  return password;
}
