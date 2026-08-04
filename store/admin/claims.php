<?php
declare(strict_types=1);
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/admin/AdminAgendaRepository.php';
require_once __DIR__ . '/../lib/admin/AdminPage.php';
requireAdmin();
$rows = (new AdminAgendaRepository($pdo))->claims(isset($_GET['status']) ? (string) $_GET['status'] : null);
adminAgendaStart('Reklamace');
$targets=['under_review','waiting_for_customer','accepted','rejected','resolved','cancelled'];
adminAgendaFilter(['submitted',...$targets]);
if(isset($_GET['id']))adminAgendaDetail((new AdminAgendaRepository($pdo))->claimDetail((string)$_GET['id']),'claim','../api/admin/claims.php',$targets);
adminAgendaTable($rows, 'claim', '../api/admin/claims.php', $targets);
adminAgendaEnd();
