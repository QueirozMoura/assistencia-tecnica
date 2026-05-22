import React from 'react';
import { Hero } from '../components/home/Hero';
import { Categories } from '../components/home/Categories';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { Benefits } from '../components/home/Benefits';
import { Stats } from '../components/home/Stats';
import { Testimonials } from '../components/home/Testimonials';
import { Brands } from '../components/home/Brands';

export function HomePage() {
  return (
    <div>
      <Hero />
      <Brands />
      <Categories />
      <FeaturedProducts />
      <Stats />
      <Benefits />
      <Testimonials />
    </div>
  );
}
