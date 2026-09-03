<?php
// Disable CORS issues for local testing if needed, or restrict to your domain in production
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON"]);
    exit;
}

// Basic validation
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$subject = trim($data['subject'] ?? 'Obecný dotaz');
$message = trim($data['message'] ?? '');

if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please fill all required fields."]);
    exit;
}

// Email configuration
$to = "info@vevit.cz"; // Replace with your email
$email_subject = "VeVit Kontakt: " . $subject;

$email_body = "Nová zpráva z webového formuláře:\n\n";
$email_body .= "Jméno: $name\n";
$email_body .= "Email: $email\n";
$email_body .= "Předmět: $subject\n\n";
$email_body .= "Zpráva:\n$message\n";

$headers = "From: noreply@vevit.cz\r\n"; // Ensure this domain matches your hosting
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email
if (mail($to, $email_subject, $email_body, $headers)) {
    echo json_encode(["success" => true, "message" => "Email sent successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to send email."]);
}
?>