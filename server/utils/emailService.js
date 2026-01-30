const nodemailer = require("nodemailer");

// 1. Cau hinh Transporter (Nguoi gui)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  // Fix loi "self-signed certificate" tren Localhost
  tls: {
    rejectUnauthorized: false,
  },
});

// 2. Ham tao noi dung Email HTML
// Doi ten tham so 'order' -> 'data' de dung chung cho ca Don hang va User
const getEmailTemplate = (data, status) => {
  const formatPrice = (price) => (price ? price.toLocaleString("vi-VN") + "d" : "0d");
  
  let subject = "";
  let title = "";
  let message = "";
  let color = "#333";

  switch (status) {
    // --- CASE DON HANG ---
    case "Pending_Payment": 
      subject = `[FashionStore] Xac nhan don hang #${data.orderNumber} - Cho thanh toan`;
      title = "Dat hang thanh cong";
      message = `Cam on ban da dat hang. Vui long hoan tat thanh toan de chung toi xu ly don hang som nhat.`;
      color = "#6b7280"; // Xam
      break;

    case "Waiting_Approval": 
      subject = `[FashionStore] Da nhan don hang #${data.orderNumber}`;
      title = "Don hang dang duoc xu ly";
      message = "Chung toi da nhan duoc yeu cau dat hang. Shop se som xac nhan don hang cua ban.";
      color = "#f59e0b"; // Cam
      break;

    case "Processing":
      subject = `[FashionStore] Don hang #${data.orderNumber} da duoc xac nhan`;
      title = "Don hang da duoc duyet!";
      message = `Shop da nhan don va dang chuan bi hang. ${data.sellerNote ? `<br/>Loi nhan: "<i>${data.sellerNote}</i>"` : ""}`;
      color = "#3b82f6"; // Xanh duong
      break;

    case "Shipped":
      subject = `[FashionStore] Don hang #${data.orderNumber} dang van chuyen`;
      title = "Don hang dang giao!";
      message = `Shipper da nhan hang. Du kien giao: ${data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate).toLocaleDateString('vi-VN') : 'Som nhat co the'}.`;
      color = "#8b5cf6"; // Tim
      break;

    case "Delivered":
        subject = `[FashionStore] Giao hang thanh cong #${data.orderNumber}`;
        title = "Giao hang thanh cong!";
        message = "Cam on ban da tin tuong FashionStore.";
        color = "#22c55e"; // Xanh la
        break;

    case "Cancelled":
      subject = `[FashionStore] Don hang #${data.orderNumber} da huy`;
      title = "Don hang da huy";
      message = `Ly do: ${data.cancelReason || "Khong xac dinh"}`;
      color = "#ef4444"; // Do
      break;

    // --- CASE QUEN MAT KHAU ---
    case "Reset_Password":
      subject = "[FashionStore] Yeu cau dat lai mat khau";
      title = "Dat lai mat khau";
      message = `Ban vua yeu cau lay lai mat khau. Nhan vao nut ben duoi de tao mat khau moi (Link het han sau 10 phut):<br/><br/>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Dat lai mat khau ngay
        </a>
      </div>
      <br/>Neu ban khong yeu cau, vui long bo qua email nay.`;
      color = "#dc2626"; // Do
      break;

    default:
      return null;
  }

  // HTML Template
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${color}; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">${title}</h2>
      </div>
      <div style="padding: 20px;">
        <p>Xin chao <strong>${data.user?.name || "Ban"}</strong>,</p>
        <div>${message}</div>
        
        ${status !== "Reset_Password" ? `
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ma don:</strong> ${data.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Tong tien:</strong> <span style="color: #d0021b; font-weight: bold;">${formatPrice(data.totalPrice)}</span></p>
            <p style="margin: 5px 0;"><strong>Dia chi:</strong> ${data.shippingAddress}</p>
          </div>
        ` : ''}

        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
          Day la email tu dong, vui long khong tra loi.<br/>
          FashionStore Team.
        </p>
      </div>
    </div>
  `;

  return { subject, html };
};

// 3. Ham gui Email
const sendOrderEmail = async (data, status) => {
  try {
    if (!data || !data.user || !data.user.email) return;

    const template = getEmailTemplate(data, status);
    if (!template) {
        console.log(`[Email] Khong co mau email cho trang thai: ${status}`);
        return;
    }

    await transporter.sendMail({
      from: '"FashionStore" <no-reply@fashionstore.com>',
      to: data.user.email,
      subject: template.subject,
      html: template.html,
    });

    console.log(`[Email] Da gui den ${data.user.email} [${status}]`);
  } catch (error) {
    console.error("[Email] Gui that bai:", error.message);
  }
};

module.exports = { sendOrderEmail };