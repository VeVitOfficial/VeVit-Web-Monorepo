<?php
declare(strict_types=1);
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/admin/AdminAgendaRepository.php';
require_once __DIR__ . '/../lib/admin/AdminPage.php';
requireAdmin();
$rows = (new AdminAgendaRepository($pdo))->returns(isset($_GET['status']) ? (string) $_GET['status'] : null);
adminAgendaStart('Vrácení');
$targets=['approved','rejected','waiting_for_goods','received','inspected','refund_pending','cancelled'];
adminAgendaFilter(['requested',...$targets,'completed']);
if(isset($_GET['id']))adminAgendaDetail((new AdminAgendaRepository($pdo))->returnDetail((string)$_GET['id']),'return','../api/admin/returns.php',$targets);
adminAgendaTable($rows, 'return', '../api/admin/returns.php', $targets);
echo '<p class="text-on-surface-variant mt-5">Manuální potvrzení dokončeného refundu zůstává fail-closed. Refund status není potvrzení skutečného převodu bez důvěryhodné evidence.</p>';
adminAgendaEnd();
