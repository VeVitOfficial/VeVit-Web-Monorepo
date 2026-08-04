<?php
declare(strict_types=1);
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/admin/AdminAgendaRepository.php';
require_once __DIR__ . '/../lib/admin/AdminPage.php';
requireAdmin();
$rows = (new AdminAgendaRepository($pdo))->deliveries(isset($_GET['status']) ? (string) $_GET['status'] : null);
adminAgendaStart('Doručení');
$targets=['prepared','handed_to_carrier','in_transit','delivery_exception','delivered','cancelled'];
adminAgendaFilter(['pending',...$targets]);
$repository=new AdminAgendaRepository($pdo);
adminAgendaDeliveryCreate($repository->deliveryCandidates(),'../api/admin/delivery-create.php');
if(isset($_GET['id']))adminAgendaDetail($repository->deliveryDetail((string)$_GET['id']),'delivery','../api/admin/deliveries.php',$targets);
adminAgendaTable($rows, 'delivery', '../api/admin/deliveries.php', $targets);
adminAgendaEnd();
