export interface ActivationResponse {
  userName: string;
  companyName: string;
  allowedProjects: string[];
}

export async function validateActivation(input: {
  userId: string;
  companyId: string;
  activationToken: string;
}): Promise<ActivationResponse> {
  // در آینده اینجا با axios یا fetch به سرور واقعی درخواست می‌زنیم
  console.log("Validating with Server...", input);

  // شبیه‌سازی تأخیر شبکه
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // خروجی فرضی مطابق با بیزینس مدل شما در آلمان
  return {
    userName: "Ali Reza",
    companyName: "Bau Müller GmbH",
    allowedProjects: ["P10", "P12", "Hansa Project"],
  };
}