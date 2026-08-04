<?php
declare(strict_types=1);
final class FavoriteService
{
 private FavoriteRepository$repo;public function __construct(PDO$pdo){$this->repo=new FavoriteRepository($pdo);}
 public function requireUserId(AuthContext$auth):string{if(!$auth->isAuthenticated()||($id=$auth->userId())===null||$id==='')throw new DomainException('Verified account required.');return$id;}
 public function add(AuthContext$a,int$p):void{if($p<1)throw new DomainException('Invalid product.');$this->repo->add($this->requireUserId($a),$p);}
 public function remove(AuthContext$a,int$p):void{$this->repo->remove($this->requireUserId($a),$p);}
 public function list(AuthContext$a):array{return$this->repo->list($this->requireUserId($a));}
}
