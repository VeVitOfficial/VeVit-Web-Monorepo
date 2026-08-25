<?php
declare(strict_types=1);
require_once __DIR__.'/../testlib.php';require_once __DIR__.'/../../lib/auth/AuthContext.php';require_once __DIR__.'/../../lib/auth/AnonymousAuthContext.php';require_once __DIR__.'/../../lib/favorites/FavoriteRepository.php';require_once __DIR__.'/../../lib/favorites/FavoriteService.php';
$pdo=new class extends PDO{public function __construct(){}};
try{(new FavoriteService($pdo))->requireUserId(new AnonymousAuthContext());test_assert_true(false,'anonymous favorites must fail');}catch(DomainException){}
$verified=new class implements AuthContext{public function isAuthenticated():bool{return true;}public function userId():?string{return'u1';}public function verifiedEmail():?string{return null;}public function hasRole(string$r):bool{return false;}public function source():string{return'test_verified';}public function verifiedAt():?DateTimeImmutable{return new DateTimeImmutable();}};
test_assert_same('u1',(new FavoriteService($pdo))->requireUserId($verified),'verified context supplies favorite owner');test_complete('favorite-service-test');
