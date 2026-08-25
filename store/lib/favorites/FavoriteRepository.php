<?php
declare(strict_types=1);
final class FavoriteRepository
{
 public function __construct(private readonly PDO$pdo){}
 public function add(string$u,int$p):void{$s=$this->pdo->prepare('INSERT INTO store_product_favorites(user_id,product_id) SELECT ?,id FROM store_products WHERE id=? AND is_active=TRUE ON CONFLICT DO NOTHING');$s->execute([$u,$p]);if($s->rowCount()===0){$q=$this->pdo->prepare('SELECT 1 FROM store_products WHERE id=? AND is_active=TRUE');$q->execute([$p]);if(!$q->fetchColumn())throw new DomainException('Product unavailable.');}}
 public function remove(string$u,int$p):void{$s=$this->pdo->prepare('DELETE FROM store_product_favorites WHERE user_id=? AND product_id=?');$s->execute([$u,$p]);}
 public function list(string$u):array{$s=$this->pdo->prepare('SELECT p.id,p.name,p.slug,p.price,p.sale_price,p.images,f.created_at FROM store_product_favorites f JOIN store_products p ON p.id=f.product_id AND p.is_active=TRUE WHERE f.user_id=? ORDER BY f.created_at DESC');$s->execute([$u]);return$s->fetchAll(PDO::FETCH_ASSOC);}
}
